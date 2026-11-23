import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { setTimeout as pause } from "node:timers/promises";
import { promisify } from "node:util";

const run = promisify(execFile);

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return server.address().port;
}

function smtpSink(messages) {
  return createServer((socket) => {
    let buffer = "";
    let message = null;
    let auth = 0;
    socket.write("220 localhost SMTP test\r\n");
    socket.on("data", (bytes) => {
      buffer += bytes.toString();
      let end;
      while ((end = buffer.indexOf("\r\n")) >= 0) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (message !== null) {
          if (line === ".") {
            messages.push(message.join("\n"));
            message = null;
            socket.write("250 Message accepted\r\n");
          } else message.push(line);
        } else if (line.startsWith("EHLO "))
          socket.write("250-localhost\r\n250 AUTH LOGIN\r\n");
        else if (line === "AUTH LOGIN") {
          auth = 1;
          socket.write("334 VXNlcm5hbWU6\r\n");
        } else if (auth === 1) {
          auth = 2;
          socket.write("334 UGFzc3dvcmQ6\r\n");
        } else if (auth === 2) {
          auth = 0;
          socket.write("235 Authenticated\r\n");
        } else if (line === "DATA") {
          message = [];
          socket.write("354 End with a single dot\r\n");
        } else if (line === "QUIT") socket.end("221 Bye\r\n");
        else socket.write("250 OK\r\n");
      }
    });
  });
}

test(
  "email recovery has uniform replies, delivers a hashed single-use token, and revokes old sessions",
  { timeout: 25000 },
  async (t) => {
    const directory = await mkdtemp(join(tmpdir(), "mdstrike-reset-"));
    const messages = [];
    const mail = smtpSink(messages);
    const mailPort = await listen(mail);
    const probe = createServer();
    const port = await listen(probe);
    await promisify(probe.close).call(probe);
    const origin = `http://127.0.0.1:${port}`;
    const env = {
      ...process.env,
      MDSTRIKE_ENV: "development",
      MDSTRIKE_DB_DRIVER: "sqlite",
      MDSTRIKE_PRIVATE_DIR: directory,
      APP_ORIGIN: origin,
      SMTP_PASSWORD: "",
      SMTP_ENCRYPTION: "none",
      SMTP_USERNAME: "reset@example.test",
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: String(mailPort),
    };
    const php = spawn(
      "php",
      [
        "-d",
        `session.save_path=${directory}`,
        "-S",
        `127.0.0.1:${port}`,
        "scripts/router.php",
      ],
      { env, stdio: "ignore" },
    );
    t.after(async () => {
      const stopped = once(php, "exit");
      if (php.kill()) await stopped;
      await promisify(mail.close).call(mail);
      await rm(directory, { recursive: true, force: true });
    });

    function client() {
      let cookie = "";
      let csrf = "";
      return async (action, data) => {
        const headers = { Cookie: cookie };
        if (data !== undefined)
          Object.assign(headers, {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrf,
            Origin: origin,
          });
        const response = await fetch(
          `${origin}/api/index.php?action=${action}`,
          {
            method: data === undefined ? "GET" : "POST",
            headers,
            body: data === undefined ? undefined : JSON.stringify(data),
          },
        );
        cookie = response.headers.get("set-cookie")?.split(";")[0] ?? cookie;
        const json = await response.json();
        csrf = json.csrf ?? csrf;
        return { status: response.status, json };
      };
    }

    const visitor = client();
    let session;
    for (let attempt = 0; attempt < 30 && !session; attempt += 1) {
      try {
        session = await visitor("session");
      } catch {
        await pause(50);
      }
    }
    assert.ok(session, "development server started");
    assert.equal(session.json.passwordResetAvailable, false);
    assert.equal(
      (
        await visitor("request-password-reset", {
          email: "student@example.test",
        })
      ).status,
      503,
    );

    // Enable only the local SMTP fixture. No messages leave loopback.
    await writeFile(
      join(directory, ".env"),
      'SMTP_PASSWORD="disposable-smtp-fixture"\n',
    );
    assert.equal((await visitor("session")).json.passwordResetAvailable, true);
    const account = client();
    await account("session");
    const email = "student@example.test";
    const original = "Original-password-123";
    const replacement = "Replacement-password-456";
    assert.equal(
      (
        await account("register", {
          email,
          password: original,
          nickname: "ResetStudent",
          consent: true,
        })
      ).status,
      201,
    );

    const requestReset = (address = email) =>
      visitor("request-password-reset", { email: address });
    const exists = await requestReset();
    const unknown = await requestReset("unknown@example.test");
    assert.equal(exists.status, 202);
    assert.deepEqual(exists, unknown);
    const worker = () =>
      run("php", ["app/password-reset-worker.php"], { env, timeout: 10000 });
    await worker();
    await worker();
    assert.equal(messages.length, 1);
    assert.match(messages[0], /To: student@example\.test/);
    const tokenFrom = (message) =>
      /#reset-password\/([a-f0-9]{64})/.exec(message)?.[1];
    const firstToken = tokenFrom(messages[0]);
    assert.ok(firstToken);
    const db = async (code) =>
      (
        await run("php", ["-r", `require 'app/bootstrap.php'; ${code}`], {
          env,
        })
      ).stdout;
    assert.equal(
      await db(
        "echo query('SELECT token_hash FROM md_password_resets')->fetchColumn();",
      ),
      createHash("sha256").update(firstToken).digest("hex"),
    );
    assert.equal(
      (
        await visitor("reset-password", {
          token: firstToken,
          password: "short",
        })
      ).status,
      400,
    );
    await db("query('UPDATE md_password_resets SET expires_at = 0');");
    const expired = await visitor("reset-password", {
      token: firstToken,
      password: replacement,
    });
    assert.equal(expired.status, 400);

    await requestReset();
    await worker();
    const token = tokenFrom(messages[1]);
    assert.ok(token && token !== firstToken);
    assert.equal(
      (await visitor("reset-password", { token, password: replacement }))
        .status,
      200,
    );
    assert.deepEqual(
      await visitor("reset-password", { token, password: replacement }),
      expired,
    );
    assert.equal((await account("session")).json.user, null);
    assert.equal((await visitor("session")).json.user, null);
    assert.equal(
      (await account("login", { identity: email, password: original })).status,
      401,
    );
    assert.equal(
      (await account("login", { identity: email, password: replacement }))
        .status,
      200,
    );

    await requestReset();
    await worker();
    const outstanding = tokenFrom(messages[2]);
    assert.ok(outstanding);
    assert.equal(
      (
        await account("change-password", {
          currentPassword: replacement,
          password: "Changed-again-789",
        })
      ).status,
      200,
    );
    assert.deepEqual(
      await visitor("reset-password", {
        token: outstanding,
        password: replacement,
      }),
      expired,
    );
    await requestReset();
    await worker();
    assert.equal(
      messages.length,
      3,
      "hourly per-address limit is applied without a different response",
    );
  },
);

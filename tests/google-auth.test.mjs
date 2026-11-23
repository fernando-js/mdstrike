import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { setTimeout as pause } from "node:timers/promises";

test(
  "Google login uses the session, preserves existing accounts, and requires consent for new accounts",
  { timeout: 15000 },
  async (t) => {
    const directory = await mkdtemp(join(tmpdir(), "mdstrike-google-"));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const probe = createServer().listen(0, "127.0.0.1");
    await once(probe, "listening");
    const port = probe.address().port;
    await new Promise((resolve) => probe.close(resolve));
    const origin = `http://127.0.0.1:${port}`;
    const clientId = "mdstrike-fixture.apps.googleusercontent.com";
    const callback = `${origin}/api/google-callback.php`;
    const fixture = join(directory, "fixture.json");
    const mock = join(directory, "google-provider.php");
    // Stub only the HTTPS provider calls in this isolated PHP process.
    await writeFile(
      mock,
      `<?php
if (!function_exists('curl_init')) {
function curl_init(string $url): object { return (object)['url' => $url]; }
function curl_setopt_array(object $client, array $options): bool { $client->options = $options; return true; }
function curl_getinfo(object $client, int $option): int { return 200; }
function curl_exec(object $client): string {
    parse_str($client->options[CURLOPT_POSTFIELDS], $data);
    $response = json_decode(file_get_contents(getenv('GOOGLE_TEST_FIXTURE')), true);
    $challenge = rtrim(strtr(base64_encode(hash('sha256', $data['code_verifier'], true)), '+/', '-_'), '=');
    if ($client->url !== 'https://oauth2.googleapis.com/token' || $data['code'] !== 'fixture-code'
        || $data['redirect_uri'] !== getenv('APP_ORIGIN') . '/api/google-callback.php'
        || $data['client_id'] !== getenv('GOOGLE_CLIENT_ID') || $data['client_secret'] !== getenv('GOOGLE_CLIENT_SECRET')
        || $data['grant_type'] !== 'authorization_code' || $challenge !== $response['challenge']
        || !$client->options[CURLOPT_SSL_VERIFYPEER] || $client->options[CURLOPT_SSL_VERIFYHOST] !== 2) {
        throw new RuntimeException('Unexpected token request');
    }
    return json_encode(['id_token' => $response['token']]);
}
}
`,
    );
    const php = spawn(
      "php",
      [
        "-d",
        `session.save_path=${directory}`,
        "-d",
        "disable_functions=curl_init,curl_setopt_array,curl_exec,curl_getinfo",
        "-d",
        `auto_prepend_file=${mock}`,
        "-S",
        `127.0.0.1:${port}`,
        "scripts/router.php",
      ],
      {
        env: {
          ...process.env,
          MDSTRIKE_ENV: "development",
          MDSTRIKE_DB_DRIVER: "sqlite",
          MDSTRIKE_PRIVATE_DIR: directory,
          APP_ORIGIN: origin,
          GOOGLE_CLIENT_ID: clientId,
          GOOGLE_CLIENT_SECRET: "local-fixture",
          GOOGLE_TEST_FIXTURE: fixture,
        },
        stdio: ["ignore", "ignore", "pipe"],
      },
    );
    let serverLog = "";
    php.stderr.on("data", (chunk) => {
      serverLog += chunk;
    });
    t.after(async () => {
      if (php.exitCode === null) {
        const done = once(php, "exit");
        php.kill();
        await done;
      }
    });

    function client() {
      let cookie = "";
      let csrf = "";
      async function request(url, body, useCsrf = true) {
        const headers = { Cookie: cookie };
        if (body)
          Object.assign(headers, {
            "Content-Type": "application/json",
            "X-CSRF-Token": useCsrf ? csrf : "",
            Origin: origin,
          });
        const response = await fetch(url, {
          headers,
          method: body ? "POST" : "GET",
          body: body && JSON.stringify(body),
          redirect: "manual",
        });
        cookie = response.headers.get("set-cookie")?.split(";")[0] ?? cookie;
        return response;
      }
      return {
        async api(action, body, useCsrf) {
          const response = await request(
            `${origin}/api/index.php?action=${action}`,
            body,
            useCsrf,
          );
          const json = await response.json();
          csrf = json.csrf ?? csrf;
          return { status: response.status, ...json };
        },
        finish(state) {
          return request(`${callback}?state=${state}&code=fixture-code`);
        },
      };
    }

    async function authorize(browser, identity, body = {}, changes = {}) {
      const start = await browser.api("google-start", body);
      assert.equal(start.status, 200);
      const auth = new URL(start.url);
      assert.equal(auth.origin, "https://accounts.google.com");
      const params = auth.searchParams;
      assert.equal(params.get("scope"), "openid email");
      assert.equal(params.get("redirect_uri"), callback);
      assert.equal(params.get("code_challenge_method"), "S256");
      const now = Math.floor(Date.now() / 1000);
      const claims = {
        iss: "https://accounts.google.com",
        aud: clientId,
        iat: now,
        exp: now + 300,
        nonce: params.get("nonce"),
        email_verified: true,
        ...identity,
        ...changes,
      };
      const state = params.get("state");
      await writeFile(
        fixture,
        JSON.stringify({
          challenge: params.get("code_challenge"),
          token: `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`,
        }),
      );
      const response = await browser.finish(state);
      assert.equal(response.status, 303);
      return { state, location: response.headers.get("location") };
    }

    const browser = client();
    let session;
    for (let attempt = 0; attempt < 40 && !session; attempt += 1) {
      try {
        session = await browser.api("session");
      } catch {
        await pause(50);
      }
    }
    assert.equal(session?.googleAuthAvailable, true, serverLog.slice(-1600));
    assert.equal((await browser.api("google-start", {}, false)).status, 403);
    const newIdentity = { sub: "google-new", email: "student@gmail.com" };
    assert.equal(
      (await authorize(browser, newIdentity, {}, { nonce: "different" }))
        .location,
      "/#google-auth/error",
    );
    assert.equal(
      (await authorize(browser, newIdentity, {}, { aud: "another-client" }))
        .location,
      "/#google-auth/error",
    );
    const signup = await authorize(browser, newIdentity);
    assert.equal(signup.location, "/#google-auth/signup");
    assert.equal(
      (await browser.finish(signup.state)).headers.get("location"),
      "/#google-auth/error",
    );
    assert.equal(
      (await browser.api("session")).googleSignupEmail,
      newIdentity.email,
    );
    const newAccount = { nickname: "GoogleLearner", consent: true };
    assert.equal(
      (await browser.api("google-register", { ...newAccount, consent: false }))
        .status,
      400,
    );
    const registered = await browser.api("google-register", newAccount);
    assert.equal(registered.status, 201);
    assert.equal(registered.user.email, newIdentity.email);
    assert.equal(registered.user.hasPassword, false);
    assert.equal(registered.user.googleLinked, true);
    await browser.api("logout", {});
    assert.equal(
      (await authorize(browser, newIdentity)).location,
      "/#google-auth/signed-in",
    );
    assert.equal((await browser.api("session")).user.id, registered.user.id);

    const local = client();
    await local.api("session");
    const existingIdentity = {
      sub: "google-existing",
      email: "existing@example.test",
    };
    const password = "local password fixture";
    const existing = await local.api("register", {
      nickname: "ExistingLearner",
      email: existingIdentity.email,
      password,
      consent: true,
    });
    assert.equal(existing.status, 201);
    const anonymous = client();
    await anonymous.api("session");
    assert.equal(
      (await authorize(anonymous, existingIdentity)).location,
      "/#google-auth/existing",
    );
    assert.equal((await anonymous.api("session")).user, null);
    assert.equal(
      (await local.api("google-start", { currentPassword: "incorrect" }))
        .status,
      401,
    );
    assert.equal(
      (await authorize(local, newIdentity, { currentPassword: password }))
        .location,
      "/#google-auth/email-mismatch",
    );
    assert.equal(
      (await authorize(local, existingIdentity, { currentPassword: password }))
        .location,
      "/#google-auth/linked",
    );
    assert.equal((await local.api("session")).user.googleLinked, true);
    assert.equal(
      (await authorize(anonymous, existingIdentity)).location,
      "/#google-auth/signed-in",
    );
    assert.equal((await anonymous.api("session")).user.id, existing.user.id);
  },
);

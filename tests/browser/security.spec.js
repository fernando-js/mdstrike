import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";

const bank = JSON.parse(fs.readFileSync("app/questions.json"));
const fixture = (sql) =>
  execFileSync("php", [
    "-r",
    '$db=new PDO("sqlite:.runtime/mdstrike.sqlite"); $db->exec($argv[1]);',
    sql,
  ]);
const scalar = (sql) =>
  Number(
    execFileSync(
      "php",
      [
        "-r",
        '$db=new PDO("sqlite:.runtime/mdstrike.sqlite"); echo $db->query($argv[1])->fetchColumn();',
        sql,
      ],
      { encoding: "utf8" },
    ),
  );
const bucket = (name, subject = "127.0.0.1") =>
  createHash("sha256").update(`${name}|${subject}`).digest("hex");
test.beforeAll(async ({ request }) => {
  await request.get("/api/index.php?action=session");
  fixture("DELETE FROM md_auth_limits");
});

test("malformed traffic has no audit side effect and both abandonment paths earn no map credit", async ({
  request,
}) => {
  let csrf = (await (await request.get("/api/index.php?action=session")).json())
    .csrf;
  const post = (action, data, headers = {}) =>
    request.post(`/api/index.php?action=${action}`, {
      headers: { "X-CSRF-Token": csrf, ...headers },
      data,
    });
  const before = scalar(
    "SELECT COUNT(*) FROM md_audit_logs WHERE event='api.error'",
  );
  for (const path of [
    "action[]=invalid",
    "action=leaderboard&map[]=all",
    "action=session&x[y]=1",
    "action=leaderboard&map=%FF",
    "action=leaderboard&specialty=%FF",
  ])
    expect((await request.get("/api/index.php?" + path)).status()).toBe(400);
  expect(
    (await request.get("/api/index.php?action=not-a-route")).status(),
  ).toBe(404);
  expect(
    (await request.get("/api/index.php?action=start-match")).status(),
  ).toBe(405);
  expect((await post("leaderboard", {})).status()).toBe(405);
  expect(
    scalar("SELECT COUNT(*) FROM md_audit_logs WHERE event='api.error'"),
  ).toBe(before);
  const registered = await post("register", {
    nickname: "sec_" + Date.now(),
    email: Date.now() + "@example.test",
    password: "Security-Regressions-12345",
    consent: true,
    isAdmin: true,
  });
  expect(registered.status()).toBe(201);
  const account = await registered.json();
  csrf = account.csrf;
  expect(account.user.isAdmin).toBe(false);
  for (const password of [[], {}, true, null])
    expect(
      (
        await post("login", { identity: account.user.email, password })
      ).status(),
    ).toBe(400);
  expect(
    (
      await post("update-profile", "[1,2]", {
        "Content-Type": "application/json",
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await post("update-profile", "{}", { "Content-Type": "text/plain" })
    ).status(),
  ).toBe(415);
  expect(
    (await post("update-profile", { padding: "x".repeat(33000) })).status(),
  ).toBe(413);
  expect(
    scalar("SELECT COUNT(*) FROM md_audit_logs WHERE event='api.error'"),
  ).toBe(before);
  const start = async () =>
    await (
      await post("start-match", { mode: "practice", map: "all", score: 999999 })
    ).json();
  const answer = (match, choice) =>
    post("answer", {
      match: match.id,
      question: match.question.id,
      choice,
      points: 999999,
    });
  const correct = (q) => {
    const raw = bank.find((item) => item.id === q.id);
    return q.options.indexOf(raw.options[raw.answer]);
  };
  const board = async () =>
    (
      await (
        await request.get("/api/index.php?action=leaderboard&map=all")
      ).json()
    ).rows.find((row) => row.id === account.user.id);
  const first = await start();
  expect(
    (await (await answer(first, correct(first.question))).json()).points,
  ).toBe(100);
  await post("abort-match", { match: first.id });
  expect(await board()).toBeUndefined();
  const second = await start();
  await answer(second, correct(second.question));
  let current = await start();
  expect(await board()).toBeUndefined();
  let result;
  for (let index = 0; index < current.total; index++) {
    const graded = await (
      await answer(current, correct(current.question))
    ).json();
    result = graded.result;
    if (!result)
      current = await (
        await post("next-question", { match: current.id })
      ).json();
  }
  expect(result).toBeTruthy();
  expect(result.score).toBe(1000);
  expect(await board()).toMatchObject({ points: 1000, played: 1 });
  expect(scalar(`SELECT score FROM md_matches WHERE id='${first.id}'`)).toBe(
    100,
  );
  expect(scalar(`SELECT score FROM md_matches WHERE id='${second.id}'`)).toBe(
    100,
  );
});

test("account login limiter binds email and nickname aliases, and API limit returns Retry-After", async ({
  request,
}) => {
  let csrf = (await (await request.get("/api/index.php?action=session")).json())
    .csrf;
  const post = (action, data) =>
    request.post("/api/index.php?action=" + action, {
      headers: { "X-CSRF-Token": csrf },
      data,
    });
  const password = "Account-Limiter-Test-12345";
  const registered = await (
    await post("register", {
      nickname: "lim_" + Date.now(),
      email: Date.now() + "@example.test",
      password,
      consent: true,
    })
  ).json();
  csrf = registered.csrf;
  for (let i = 0; i < 20; i++) {
    fixture(`DELETE FROM md_auth_limits WHERE bucket='${bucket("login")}'`);
    const r = await post("login", {
      identity: (i % 2
        ? registered.user.nickname
        : registered.user.email
      ).toUpperCase(),
      password: "wrong-password",
    });
    expect(r.status()).toBe(401);
  }
  fixture(`DELETE FROM md_auth_limits WHERE bucket='${bucket("login")}'`);
  const blocked = await post("login", {
    identity: registered.user.email,
    password,
  });
  expect(blocked.status()).toBe(429);
  expect(Number(blocked.headers()["retry-after"])).toBeGreaterThan(0);
  const accountKey = bucket("login-account", "user:" + registered.user.id);
  fixture(
    `UPDATE md_auth_limits SET window_start=${Math.floor(Date.now() / 1000) - 901} WHERE bucket='${accountKey}'`,
  );
  const success = await post("login", {
    identity: registered.user.nickname,
    password,
  });
  expect(success.status()).toBe(200);
  csrf = (await success.json()).csrf;
  expect(
    scalar(`SELECT COUNT(*) FROM md_auth_limits WHERE bucket='${accountKey}'`),
  ).toBe(0);
  fixture(
    `UPDATE md_auth_limits SET attempts=600,window_start=${Math.floor(Date.now() / 1000)} WHERE bucket='${bucket("api")}'`,
  );
  const burst = await request.get("/api/index.php?action=session", {
    headers: { "X-Forwarded-For": "203.0.113.9" },
  });
  expect(burst.status()).toBe(429);
  expect(Number(burst.headers()["retry-after"])).toBeGreaterThan(0);
  fixture(`DELETE FROM md_auth_limits WHERE bucket='${bucket("api")}'`);
});

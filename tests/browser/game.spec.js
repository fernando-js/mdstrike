import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
const bank = JSON.parse(fs.readFileSync("app/questions.json"));
test.beforeAll(() => {
  // Only reset local QA counters so repeated test runs do not hit registration limits.
  if (fs.existsSync(".runtime/mdstrike.sqlite"))
    execFileSync("php", [
      "-r",
      '$db = new PDO("sqlite:.runtime/mdstrike.sqlite"); $db->exec("DELETE FROM md_auth_limits");',
    ]);
});
const lookup = (q) => {
  const raw = bank.find((x) => x.id === q.id);
  return raw.kind === "official"
    ? raw.answer
    : q.options.indexOf(raw.options[raw.answer]);
};
const unique = () => `${Date.now()}${Math.floor(Math.random() * 100000)}`;

test("lobby, map filters, guest round, review and mobile layout", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText(
    "Conhecimento é a sua melhor arma.",
  );
  await page.getByRole("button", { name: "Mapas", exact: true }).click();
  await page.locator("#map-search").fill("anestesiologia");
  await expect(page.locator(".map-card")).toHaveCount(1);
  await page.locator('[data-map="anestesiologia"]').click();
  await expect(page.locator("#modal")).toContainText("Anestesiologia");
  await page.getByRole("button", { name: "Treinar específicas" }).click();
  await expect(page.locator(".answer")).toHaveCount(4);
  await page.keyboard.press("1");
  await expect(page.locator(".feedback")).toBeVisible();
  await expect(page.locator(".answer.correct")).toHaveCount(1);
  await page.keyboard.press("Enter");
  await expect(page.locator(".feedback")).toHaveCount(0);
  await page.getByRole("button", { name: "Sair da partida" }).click();
  await page.getByRole("button", { name: "Encerrar partida" }).click();
  await expect(page.locator(".operation")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Iniciar treino" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("account, server scoring, replay protection, ranking privacy and password changes", async ({
  request,
  playwright,
}) => {
  const suffix = unique(),
    nick = `op_${suffix}`.slice(0, 24),
    email = `${suffix}@example.test`,
    password = "Correct-Horse-12345";
  let session = await (
    await request.get("/api/index.php?action=session")
  ).json();
  const post = async (action, data, token = session.csrf) =>
    request.post(`/api/index.php?action=${action}`, {
      headers: { "X-CSRF-Token": token },
      data,
    });
  const invalid = await request.post("/api/index.php?action=register", {
    data: { nickname: nick, email, password, consent: true },
  });
  expect(invalid.status()).toBe(403);
  const registered = await post("register", {
    nickname: nick,
    email,
    password,
    consent: true,
    specialty: "cardiologia",
  });
  expect(registered.status()).toBe(201);
  const account = await registered.json();
  session.csrf = account.csrf;
  expect(account.user.email).toBe(email);
  let response = await post("start-match", {
    mode: "practice",
    map: "all",
    score: 999999,
  });
  expect(response.ok()).toBeTruthy();
  let current = await response.json();
  expect(current.question.answer).toBeUndefined();
  expect(current.question.explanation).toBeUndefined();
  let result;
  for (let i = 0; i < current.total; i++) {
    const answer = await post("answer", {
      match: current.id,
      question: current.question.id,
      choice: lookup(current.question),
      points: 999999,
      rating: 999999,
    });
    expect(answer.ok()).toBeTruthy();
    const graded = await answer.json();
    expect(graded.points).toBe(100);
    const replay = await post("answer", {
      match: current.id,
      question: current.question.id,
      choice: 0,
    });
    expect(replay.status()).toBe(409);
    if (graded.result) {
      result = graded.result;
      break;
    }
    response = await post("next-question", { match: current.id });
    expect(response.ok()).toBeTruthy();
    current = await response.json();
  }
  expect(result.score).toBe(1000);
  expect(result.ratingDelta).toBe(0);
  const profile = await (
    await request.get("/api/index.php?action=profile")
  ).json();
  expect(profile.user.points).toBe(1000);
  expect(profile.user.played).toBe(1);
  expect(profile.user.rating).toBe(1000);
  expect(profile.user.xp).toBe(210);
  const board = await (
    await request.get("/api/index.php?action=leaderboard")
  ).json();
  const row = board.rows.find((u) => u.id === account.user.id);
  expect(row.nickname).toBe(nick);
  expect(row.email).toBeUndefined();
  expect(row.password_hash).toBeUndefined();
  const relative = await (
    await request.get("/api/index.php?action=leaderboard&specialty=neurologia")
  ).json();
  expect(relative.rows.find((u) => u.id === account.user.id)).toBeUndefined();
  const second = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:8088",
  });
  const otherSession = await (
    await second.get("/api/index.php?action=session")
  ).json();
  const otherLogin = await second.post("/api/index.php?action=login", {
    headers: { "X-CSRF-Token": otherSession.csrf },
    data: { identity: email, password },
  });
  expect(otherLogin.ok()).toBeTruthy();
  response = await post("change-password", {
    currentPassword: password,
    password: "Another-Correct-12345",
  });
  expect(response.ok()).toBeTruthy();
  session.csrf = (await response.json()).csrf;
  const revoked = await second.get("/api/index.php?action=profile");
  expect(revoked.status()).toBe(401);
  const stillAuthenticated = await request.get("/api/index.php?action=profile");
  expect(stillAuthenticated.ok()).toBeTruthy();
  await second.dispose();
});

test("private files stay inaccessible and official question uses a valid PDF", async ({
  request,
  page,
}) => {
  for (const path of [
    "/app/questions.json",
    "/app/config.example.php",
    "/.env",
    "/.runtime/mdstrike.sqlite",
  ])
    expect((await request.get(path)).status()).toBe(404);
  await page.goto("/#archive");
  await page.locator('[data-exam="enamed-2025"]').click();
  await expect(page.locator("#pdf-viewer")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.locator("#pdf-viewer")).toHaveAttribute("data-page", "3");
  await expect(page.locator("#pdf-viewer canvas")).toBeVisible();
  await expect(page.locator(".answer")).toHaveCount(4);
  expect(
    (
      await request.get("/assets/documents/enamed-2025-caderno-1.pdf")
    ).headers()["content-type"],
  ).toContain("application/pdf");
});

test("server competitions finish once and update game rating", async ({
  request,
}) => {
  const suffix = unique();
  let csrf = (await (await request.get("/api/index.php?action=session")).json())
    .csrf;
  const post = (action, data) =>
    request.post(`/api/index.php?action=${action}`, {
      headers: { "X-CSRF-Token": csrf },
      data,
    });
  const registered = await post("register", {
    nickname: `rank_${suffix}`.slice(0, 24),
    email: `rank_${suffix}@example.test`,
    password: "Secure-Test-Password123",
    consent: true,
  });
  expect(registered.ok()).toBeTruthy();
  csrf = (await registered.json()).csrf;
  let expectedRating = 1000,
    played = 0;
  for (const mode of ["duel", "competitive", "cup"]) {
    let current = await (
      await post("start-match", { mode, map: "all" })
    ).json();
    const ids = new Set();
    let result;
    for (let i = 0; i < 15; i++) {
      expect(ids.has(current.question.id)).toBe(false);
      ids.add(current.question.id);
      const response = await post("answer", {
        match: current.id,
        question: current.question.id,
        choice: lookup(current.question),
      });
      expect(response.ok()).toBeTruthy();
      const graded = await response.json();
      expect(graded.points).toBeLessThanOrEqual(150);
      if (graded.result) {
        result = graded.result;
        break;
      }
      current = await (
        await post("next-question", { match: current.id })
      ).json();
    }
    expect(result).toBeTruthy();
    expect(result.ranked).toBe(true);
    expect([20, -12]).toContain(result.ratingDelta);
    if (mode === "cup") {
      expect(result.win).toBe(true);
      expect(result.answered).toBe(15);
    }
    if (mode === "competitive")
      expect(Math.max(result.roundsWon, result.roundsLost)).toBe(5);
    expectedRating += result.ratingDelta;
    played++;
    const profile = await (
      await request.get("/api/index.php?action=profile")
    ).json();
    expect(profile.user.rating).toBe(expectedRating);
    expect(profile.user.played).toBe(played);
    const replay = await post("next-question", { match: current.id });
    expect(replay.status()).toBe(409);
  }
});

test("shared challenge uses identical questions, supports two accounts and prevents repeat attempts", async ({
  browser,
}) => {
  const host = await browser.newContext({ baseURL: "http://127.0.0.1:8088" });
  const colleague = await browser.newContext({
    baseURL: "http://127.0.0.1:8088",
  });
  const accounts = [];
  for (const context of [host, colleague]) {
    const suffix = unique();
    const session = await (
      await context.request.get("/api/index.php?action=session")
    ).json();
    const response = await context.request.post(
      "/api/index.php?action=register",
      {
        headers: { "X-CSRF-Token": session.csrf },
        data: {
          nickname: `duel_${suffix}`.slice(0, 24),
          email: `duel_${suffix}@example.test`,
          password: "Challenge-Test-123456",
          consent: true,
        },
      },
    );
    expect(response.status()).toBe(201);
    accounts.push(await response.json());
  }
  const page = await host.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#competitions");
  await page
    .getByRole("button", { name: "Criar desafio", exact: true })
    .click();
  await page.getByRole("button", { name: "Gerar link de desafio" }).click();
  await expect(page.locator("#challenge-link")).toBeVisible();
  const link = await page.locator("#challenge-link").inputValue();
  expect(link).toMatch(/#challenge\/[a-f0-9]{32}$/);
  const id = link.split("/").at(-1);
  const invited = await colleague.newPage();
  await invited.goto(link);
  await expect(invited.locator("h1")).toHaveText("Um link. O mesmo desafio.");
  await expect(
    invited.getByRole("button", { name: "Aceitar desafio" }),
  ).toBeVisible();
  const guest = await browser.newContext({ baseURL: "http://127.0.0.1:8088" });
  const guestPage = await guest.newPage();
  await guestPage.goto(link);
  await expect(
    guestPage.getByRole("button", { name: "Entrar para participar" }),
  ).toBeVisible();
  await guestPage
    .getByRole("button", { name: "Entrar para participar" })
    .click();
  await expect(guestPage.locator("#auth-form")).toBeVisible();
  await guestPage.locator('[name="identity"]').fill(accounts[1].user.email);
  await guestPage.locator('[name="password"]').fill("Challenge-Test-123456");
  await guestPage
    .getByRole("button", { name: "Entrar na conta", exact: true })
    .click();
  await expect(guestPage.locator("h1")).toHaveText("Um link. O mesmo desafio.");
  await expect(
    guestPage.getByRole("button", { name: "Aceitar desafio" }),
  ).toBeVisible();
  const runs = [];
  for (let i = 0; i < 2; i++) {
    const context = [host, colleague][i];
    const r = await context.request.post(
      "/api/index.php?action=join-challenge",
      {
        headers: { "X-CSRF-Token": accounts[i].csrf },
        data: { challenge: id },
      },
    );
    expect(r.ok()).toBeTruthy();
    runs.push(await r.json());
  }
  expect(runs[0].question).toEqual(runs[1].question);
  expect(runs[0].timeLimit).toBe(60);
  expect(runs[0].question.answer).toBeUndefined();
  const firstId = runs[0].question.id;
  const resume = await host.request.post(
    "/api/index.php?action=join-challenge",
    { headers: { "X-CSRF-Token": accounts[0].csrf }, data: { challenge: id } },
  );
  expect((await resume.json()).question.id).toBe(firstId);
  for (let i = 0; i < 2; i++) {
    const context = [host, colleague][i],
      csrf = accounts[i].csrf;
    let current = runs[i];
    let result;
    const ids = [];
    for (let round = 0; round < 7; round++) {
      ids.push(current.question.id);
      const graded = await (
        await context.request.post("/api/index.php?action=answer", {
          headers: { "X-CSRF-Token": csrf },
          data: {
            match: current.id,
            question: current.question.id,
            choice: i === 0 ? lookup(current.question) : -1,
          },
        })
      ).json();
      expect(graded.botPoints).toBe(0);
      if (graded.result) {
        result = graded.result;
        break;
      }
      current = await (
        await context.request.post("/api/index.php?action=next-question", {
          headers: { "X-CSRF-Token": csrf },
          data: { match: current.id },
        })
      ).json();
    }
    expect(result.answered).toBe(7);
    expect(result.ratingDelta).toBe(0);
    expect(new Set(ids).size).toBe(7);
    if (i === 0) runs.push(ids);
    else expect(ids).toEqual(runs[2]);
    const again = await context.request.post(
      "/api/index.php?action=join-challenge",
      { headers: { "X-CSRF-Token": csrf }, data: { challenge: id } },
    );
    expect(again.status()).toBe(409);
  }
  const scoreboard = await (
    await guest.request.get(`/api/index.php?action=challenge&id=${id}`)
  ).json();
  expect(scoreboard.scores).toHaveLength(2);
  expect(scoreboard.scores[0].correct).toBe(7);
  expect(scoreboard.scores[1].correct).toBe(0);
  expect(scoreboard.questions_json).toBeUndefined();
  expect(scoreboard.scores[0].email).toBeUndefined();
  await page.reload();
  await expect(page.locator(".table-wrap tbody tr")).toHaveCount(2);
  await expect(page.locator(".table-wrap")).toContainText("Concluído");
  await page.screenshot({
    path: "/private/tmp/mdstrike-challenge-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/private/tmp/mdstrike-challenge-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  const third = await browser.newContext({ baseURL: "http://127.0.0.1:8088" });
  const thirdSession = await (
    await third.request.get("/api/index.php?action=session")
  ).json();
  const suffix = unique();
  const signup = await third.request.post("/api/index.php?action=register", {
    headers: { "X-CSRF-Token": thirdSession.csrf },
    data: {
      nickname: `third_${suffix}`.slice(0, 24),
      email: `third_${suffix}@example.test`,
      password: "Challenge-Test-123456",
      consent: true,
    },
  });
  expect(signup.ok()).toBeTruthy();
  const thirdAccount = await signup.json();
  const post = (action, data) =>
    third.request.post(`/api/index.php?action=${action}`, {
      headers: { "X-CSRF-Token": thirdAccount.csrf },
      data,
    });
  const runA = await (await post("join-challenge", { challenge: id })).json();
  const secondChallenge = await (
    await post("create-challenge", { map: "all" })
  ).json();
  const runB = await (
    await post("join-challenge", { challenge: secondChallenge.id })
  ).json();
  expect(runA.id).not.toBe(runB.id);
  execFileSync("php", [
    "-r",
    '$db = new PDO("sqlite:.runtime/mdstrike.sqlite"); $q=$db->prepare("UPDATE md_matches SET issued_at = ? WHERE id = ?"); $q->execute([time()-45,$argv[1]]);',
    runA.id,
  ]);
  const resumedA = await (
    await post("join-challenge", { challenge: id })
  ).json();
  expect(resumedA.id).toBe(runA.id);
  expect(resumedA.timeRemaining).toBeLessThanOrEqual(15);
  expect(resumedA.timeRemaining).toBeGreaterThan(0);
  const practice = await post("start-match", { mode: "practice", map: "all" });
  expect(practice.ok()).toBeTruthy();
  expect(
    (
      await (
        await post("join-challenge", { challenge: secondChallenge.id })
      ).json()
    ).id,
  ).toBe(runB.id);
  const thirdPage = await third.newPage();
  await thirdPage.goto(link);
  await thirdPage
    .getByRole("button", { name: "Continuar minha tentativa" })
    .click();
  await expect(thirdPage.locator(".answer")).toHaveCount(4);
  await thirdPage.getByRole("button", { name: "Sair da partida" }).click();
  await thirdPage.getByRole("button", { name: "Salvar e sair" }).click();
  await expect(thirdPage.locator(".operation")).toBeVisible();
  const stillActive = await (
    await post("join-challenge", { challenge: id })
  ).json();
  expect(stillActive.id).toBe(runA.id);
  const group = await (
    await third.request.get(`/api/index.php?action=challenge&id=${id}`)
  ).json();
  expect(group.scores).toHaveLength(3);
  const thirdRow = group.scores.find(
    (s) => s.nickname === thirdAccount.user.nickname,
  );
  expect(thirdRow.status).toBe("playing");
  expect(thirdRow.score).toBeNull();
  await third.close();
  await guest.close();
  await host.close();
  await colleague.close();
});

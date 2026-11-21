import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const bank = JSON.parse(fs.readFileSync("app/revalida-questions.json"));
const endpoint = (action) => "/api/index.php?action=" + action;

test("exam landing pages expose crawlable HTML, canonical links and a sitemap", async ({
  request,
}) => {
  const origin = "https://mdstrike.com";
  for (const [route, text] of [
    ["/", "Estudo de Medicina e simulados médicos"],
    ["/enamed/", "Simulado Enamed"],
    ["/enare/", "Provas anteriores do Enare"],
    ["/revalida/", "Simulado Revalida"],
    ["/revalida/2026-1/", "59 pontos"],
  ]) {
    const response = await request.get(route);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(text);
    expect(html).toContain('rel="canonical" href="' + origin + route + '"');
  }

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.headers()["content-type"]).toContain("application/xml");
  const urls = [...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map(
    ([, url]) => url,
  );
  const results = JSON.parse(fs.readFileSync("app/enamed-results.json"));
  const examUrls = urls.filter((url) =>
    /^\/(?:enamed\/|enare\/|revalida\/|$)/.test(new URL(url).pathname),
  );
  expect(examUrls).toHaveLength(33 + results.courses.length);
  expect(new Set(urls).size).toBe(urls.length);
  for (const url of urls.filter(
    (entry) => !entry.includes("/resultados/curso/"),
  ))
    expect(
      (
        await request.get(url.slice(origin.length), { maxRedirects: 0 })
      ).status(),
    ).toBe(200);
  expect(await (await request.get("/robots.txt")).text()).toContain(
    "Sitemap: " + origin + "/sitemap.xml",
  );
  expect((await request.get("/revalida/nao-existe/")).status()).toBe(404);
  expect(
    (await request.get("/revalida/2026-1", { maxRedirects: 0 })).status(),
  ).toBe(301);
});

test("guest starts from the public page, changes a mark, resumes, and sees only the final correction", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/revalida/2026-1/");
  await page.getByRole("link", { name: "Iniciar simulado" }).click();
  await page.getByRole("button", { name: "Jogar caderno" }).click();
  await page.getByRole("button", { name: "Iniciar ou retomar" }).click();
  await expect(page.locator("h1")).toHaveText("Simulado Revalida");
  await expect(page.locator("#pdf-viewer canvas")).toBeVisible();
  await expect(page.locator("#sim-clock")).toHaveText(
    /^(04:59:\d\d|05:00:00)$/,
  );
  await page.getByRole("button", { name: "A", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "A", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#feedback")).toBeEmpty();
  await page.getByRole("button", { name: "Próxima", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Questão 2 ·/ }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Ir para questão" })
    .selectOption("0");
  await page.getByRole("button", { name: "D", exact: true }).click();
  await page.getByRole("button", { name: "Sair do simulado" }).click();
  await page.getByRole("button", { name: "Salvar e sair" }).click();
  await expect(
    page.getByRole("heading", { name: "Operação Revalida" }),
  ).toBeVisible();
  await page.locator('button[data-exam="revalida-2026-1"]').click();
  await page.getByRole("button", { name: "Iniciar ou retomar" }).click();
  await page
    .getByRole("combobox", { name: "Ir para questão" })
    .selectOption("0");
  await expect(
    page.getByRole("button", { name: "D", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Entregar simulado" }).click();
  await page.getByRole("button", { name: "Entregar e corrigir" }).click();
  await expect(
    page.getByRole("heading", { name: "Resultado do simulado" }),
  ).toBeVisible();
  await expect(page.getByText("1/100", { exact: true })).toBeVisible();
  await expect(page.getByText("Abaixo", { exact: true })).toBeVisible();
  await expect(page.getByRole("row").nth(1)).toContainText("D ✓");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("score and first-attempt comparison are server-calculated and isolated from the main progress", async ({
  request,
}) => {
  test.setTimeout(45000);
  const session = await (await request.get(endpoint("session"))).json();
  execFileSync("php", [
    "-r",
    '$db = new PDO("sqlite:.runtime/mdstrike.sqlite"); $db->exec("DELETE FROM md_auth_limits");',
  ]);
  let csrf = session.csrf;
  const call = (action, data) =>
    request.post(endpoint(action), { headers: { "X-CSRF-Token": csrf }, data });
  const compare = async (exam) => {
    const { editions } = await (
      await request.get(endpoint("revalida-comparison"))
    ).json();
    return (
      editions.find((entry) => entry.exam === exam) ?? {
        participants: 0,
        reached: 0,
      }
    );
  };
  const exam = "revalida-2026-1";
  const before = await compare(exam);
  const suffix = Date.now().toString(36);
  const registered = await call("register", {
    nickname: "rv_" + suffix,
    email: suffix + "@example.test",
    password: "Revalida-test-12345",
    consent: true,
  });
  expect(registered.status()).toBe(201);
  csrf = (await registered.json()).csrf;
  const start = async (edition = exam) => {
    const response = await call("start-match", {
      mode: "revalida-exam",
      map: "revalida-geral",
      exam: edition,
      formation: "brasil",
    });
    expect(response.ok()).toBeTruthy();
    return response.json();
  };
  const first = await start();
  expect(first.questions).toHaveLength(100);
  expect(first.questions[0].answer).toBeUndefined();
  expect(first.remaining).toBeGreaterThan(17990);
  expect(
    (
      await call("answer", {
        match: first.id,
        question: first.questions[0].id,
        choice: 3,
      })
    ).status(),
  ).toBe(409);
  for (let index = 0; index < 59; index++) {
    const choice = bank.find((q) => q.id === first.questions[index].id).answer;
    expect(
      (await call("revalida-mark", { match: first.id, index, choice })).ok(),
    ).toBeTruthy();
  }
  const resumed = await start();
  expect(resumed.id).toBe(first.id);
  expect(Object.keys(resumed.choices)).toHaveLength(59);
  const submit = async (id) => {
    const response = await call("revalida-submit", { match: id, score: 100 });
    expect(response.ok()).toBeTruthy();
    return (await response.json()).result;
  };
  const result = await submit(first.id);
  expect(result).toMatchObject({
    score: 59,
    cutoff: 59,
    reachedCutoff: true,
    answered: 59,
  });
  expect(await submit(first.id)).toEqual(result);
  const second = await start();
  expect(second.id).not.toBe(first.id);
  expect(
    (
      await call("revalida-mark", { match: second.id, index: 0, choice: 0 })
    ).ok(),
  ).toBeTruthy();
  expect((await submit(second.id)).reachedCutoff).toBe(false);
  expect(await compare(exam)).toMatchObject({
    participants: before.participants + 1,
    reached: before.reached + 1,
  });

  const historic = await start("revalida-2025-2");
  expect(historic.questions).toHaveLength(93);
  expect(
    (
      await call("revalida-mark", { match: historic.id, index: 0, choice: 0 })
    ).ok(),
  ).toBeTruthy();
  expect(await submit(historic.id)).toMatchObject({
    correct: 1,
    score: 8,
    maximum: 100,
    cancelledCredit: 7,
    cutoff: 61,
  });

  const profile = await (await request.get(endpoint("profile"))).json();
  expect(profile.user).toMatchObject({
    points: 0,
    xp: 0,
    played: 0,
    answered: 0,
  });
  expect(profile.history).toEqual([]);
  expect(profile.revalida.history).toHaveLength(3);
  expect(profile.wrong).toEqual([]);
  expect(profile.revalida.wrong.length).toBeGreaterThan(0);
  const practice = await call("start-match", {
    mode: "practice",
    map: "revalida-ped",
  });
  expect(practice.ok()).toBeTruthy();
  expect((await practice.json()).question).toMatchObject({ exam, area: "PED" });
});

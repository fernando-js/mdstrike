import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const fixture = (sql) =>
  execFileSync("php", [
    "-r",
    '$db=new PDO("sqlite:.runtime/mdstrike.sqlite"); $db->exec($argv[1]);',
    sql,
  ]);
test.beforeAll(async ({ request }) => {
  await request.get("/api/index.php?action=session");
  fixture("DELETE FROM md_auth_limits");
});

test("administration protects records, records activity and renders desktop/mobile", async ({
  browser,
  request,
}) => {
  const suffix = Date.now().toString();
  const owner = await browser.newContext();
  const player = await browser.newContext({
    userAgent: '<img src=x onerror="window.auditInjected=true">',
  });
  const password = "Admin-QA-passphrase-123";
  async function register(context, prefix) {
    const session = await (
      await context.request.get("/api/index.php?action=session")
    ).json();
    const response = await context.request.post(
      "/api/index.php?action=register",
      {
        headers: { "X-CSRF-Token": session.csrf },
        data: {
          nickname: prefix + suffix,
          email: `${prefix}${suffix}@example.test`,
          password,
          consent: true,
          isAdmin: true,
        },
      },
    );
    expect(response.status()).toBe(201);
    return response.json();
  }
  const admin = await register(owner, "adm");
  const member = await register(player, "usr");
  expect(admin.user.isAdmin).toBe(false);
  expect(member.user.isAdmin).toBe(false);
  const endpoints = [
    "admin-overview",
    "admin-users",
    "admin-user&id=" + member.user.id,
    "admin-matches",
    "admin-challenges",
    "admin-logs",
  ];
  for (const action of endpoints) {
    expect(
      (await request.get("/api/index.php?action=" + action)).status(),
    ).toBe(401);
    expect(
      (await player.request.get("/api/index.php?action=" + action)).status(),
    ).toBe(403);
  }
  const post = (action, data) =>
    player.request.post("/api/index.php?action=" + action, {
      headers: { "X-CSRF-Token": member.csrf },
      data,
    });
  await post("update-profile", {
    nickname: member.user.nickname,
    institution: '<img src=x onerror="window.auditInjected=true">',
    isAdmin: true,
  });
  expect(
    (await (await player.request.get("/api/index.php?action=profile")).json())
      .user.isAdmin,
  ).toBe(false);
  fixture(
    `INSERT INTO md_admins (user_id,granted_at) VALUES (${Number(admin.user.id)},${Math.floor(Date.now() / 1000)})`,
  );
  const match = await (
    await post("start-match", { mode: "practice", map: "all" })
  ).json();
  expect(match.id).toBeTruthy();
  expect(
    (
      await post("answer", {
        match: match.id,
        question: match.question.id,
        choice: 0,
      })
    ).ok(),
  ).toBe(true);
  const get = async (action, params = {}) => {
    const response = await owner.request.get(
      "/api/index.php?" + new URLSearchParams({ action, ...params }),
    );
    expect(response.ok()).toBe(true);
    const text = await response.text();
    expect(text).not.toMatch(
      /password_hash|password_fingerprint|db_password|DB_PASSWORD/,
    );
    expect(text).not.toContain(password);
    return JSON.parse(text);
  };
  const metric = await request.post("/api/enamed-metrics.php", {
    headers: { Origin: "http://127.0.0.1:8088" },
    data: { event: "first_answer" },
  });
  expect(metric.status()).toBe(204);
  const metrics = await get("admin-overview");
  expect(Number(metrics.enamedMetrics.first_answer)).toBeGreaterThan(0);
  const filtered = await get("admin-users", { search: member.user.email });
  expect(filtered.total).toBe(1);
  expect(filtered.rows[0].email).toBe(member.user.email);
  expect(filtered.rows[0].admin_since).toBeNull();
  expect((await get("admin-users", { search: "' OR 1=1 --" })).total).toBe(0);
  const detail = await get("admin-user", { id: member.user.id });
  expect(detail.answers).toHaveLength(1);
  expect(detail.matches[0].id).toBe(match.id);
  expect(
    (await get("admin-matches", { user: member.user.id })).rows,
  ).toHaveLength(1);
  const logs = await get("admin-logs", {
    user: member.user.id,
    event: "answer.submitted",
  });
  expect(logs.rows).toHaveLength(1);
  expect(logs.rows[0].user_agent).toContain("<img");
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
  expect(
    (
      await get("admin-logs", {
        from: today,
        to: today,
        user: member.user.id,
        event: "account.registered",
      })
    ).total,
  ).toBe(1);
  expect(
    (
      await owner.request.get(
        "/api/index.php?action=admin-logs&from=2026-02-30",
      )
    ).status(),
  ).toBe(400);
  expect(
    (
      await owner.request.post("/api/index.php?action=admin-users", {
        data: {},
      })
    ).status(),
  ).toBe(405);
  const leaderboard = await (
    await request.get("/api/index.php?action=leaderboard")
  ).text();
  expect(leaderboard).not.toMatch(/email|password|isAdmin|admin_since/);
  const page = await owner.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#admin");
  await expect(page.locator("h1")).toHaveText("Central de comando.");
  await expect(page.locator("#admin-content")).toContainText(
    "Usuários cadastrados",
  );
  await page.getByText("Ver métricas por dia", { exact: true }).click();
  await expect(page.getByRole("columnheader", { name: "Primeiras respostas" })).toBeVisible();
  await expect(page).toHaveTitle(/MD Strike/i);
  await page.screenshot({
    path: "/private/tmp/mdstrike-admin-desktop.png",
    fullPage: false,
  });
  await page.locator('[data-admin-tab="users"]').first().click();
  await page
    .locator('#admin-filter-form input[name="search"]')
    .fill(member.user.email);
  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  await expect(page.locator("#admin-content tbody tr")).toHaveCount(1);
  await page.locator('[data-admin-user="' + member.user.id + '"]').click();
  await expect(page.locator(".admin-user-detail")).toContainText(
    member.user.email,
  );
  expect(await page.evaluate(() => !!window.auditInjected)).toBe(false);
  await page.locator("[data-admin-user-logs]").click();
  await expect(page.locator("#admin-content")).toContainText(
    "Resposta registrada",
  );
  await page
    .locator("#admin-content tr")
    .filter({ hasText: "answer.submitted" })
    .locator("summary")
    .click();
  await expect(page.locator(".audit-details[open]")).toContainText("<img");
  expect(await page.evaluate(() => !!window.auditInjected)).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/private/tmp/mdstrike-admin-mobile.png",
    fullPage: false,
  });
  expect(errors).toEqual([]);
  fixture(`DELETE FROM md_admins WHERE user_id=${Number(admin.user.id)}`);
  expect(
    (await owner.request.get("/api/index.php?action=admin-users")).status(),
  ).toBe(403);
  await page.reload();
  await expect(page.locator("h1")).toHaveText(
    "Conhecimento é a sua melhor arma.",
  );
  await expect(page).toHaveURL(/#lobby$/);
  await expect(page.locator('a[href="#admin"]')).toHaveCount(0);
  await owner.close();
  await player.close();
});

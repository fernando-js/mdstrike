import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

test.beforeAll(async ({ request }) => {
  await request.get("/api/index.php?action=session");
  execFileSync("php", [
    "-r",
    '$db=new PDO("sqlite:.runtime/mdstrike.sqlite");$db->exec("DELETE FROM md_auth_limits");',
  ]);
});

test("logout is visible in the lobby and administrative routes stay hidden from guests and regular players", async ({
  page,
  context,
  playwright,
}) => {
  const errors = [],
    adminRequests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    const action = new URL(r.url()).searchParams.get("action");
    if (action?.startsWith("admin-")) adminRequests.push(action);
  });
  const lobby = async () => {
    await expect(page.locator("h1")).toHaveText(
      "Conhecimento é a sua melhor arma.",
    );
    await expect(page).toHaveURL(/#lobby$/);
    expect(await page.locator('[data-page="admin"]').count()).toBe(0);
    expect(await page.locator("#admin-content")).toHaveCount(0);
  };
  for (const path of ["admin", "admin/users", "admin/logs"]) {
    await page.goto("/#" + path);
    await lobby();
    await expect(page.locator("#logout-button")).toBeHidden();
  }
  const session = await (
    await context.request.get("/api/index.php?action=session")
  ).json();
  const account = await context.request.post("/api/index.php?action=register", {
    headers: { "X-CSRF-Token": session.csrf },
    data: {
      nickname: ("op_" + Date.now() + "_longname").slice(0, 24),
      email: Date.now() + "@example.test",
      password: "Navigation-Test-12345",
      consent: true,
    },
  });
  expect(account.status()).toBe(201);
  expect((await account.json()).user.isAdmin).toBe(false);
  await page.reload();
  await lobby();
  await expect(
    page.getByRole("button", { name: "Sair da conta", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveTitle(/MD Strike/);
  await page.screenshot({
    path: "/private/tmp/mdstrike-lobby-logout-desktop.png",
    fullPage: false,
  });
  for (const path of ["admin", "admin/users", "admin/matches"]) {
    await page.goto("/#" + path);
    await lobby();
  }
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator("#logout-button")).toBeInViewport();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await lobby();
  await page.screenshot({
    path: "/private/tmp/mdstrike-lobby-logout-mobile.png",
    fullPage: false,
  });
  const old = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:8088",
    storageState: await context.storageState(),
  });
  try {
    await page
      .getByRole("button", { name: "Sair da conta", exact: true })
      .click();
    await expect(page.locator("#logout-button")).toBeHidden();
    await lobby();
    expect(
      (
        await (
          await context.request.get("/api/index.php?action=session")
        ).json()
      ).user,
    ).toBeNull();
    expect((await old.get("/api/index.php?action=profile")).status()).toBe(401);
    await page.reload();
    await lobby();
    await expect(page.locator("#logout-button")).toBeHidden();
  } finally {
    await old.dispose();
  }
  expect(adminRequests).toEqual([]);
  expect(errors).toEqual([]);
});

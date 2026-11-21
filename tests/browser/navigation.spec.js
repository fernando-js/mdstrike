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
    await expect(page.locator('a[href="#admin"]')).toHaveCount(0);
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

test("study navigation preserves filters, scroll and open panels when returning", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 620 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Navegação principal" });
  await nav.getByRole("link", { name: "Consulta rápida", exact: true }).click();
  const field = page.getByRole("searchbox", {
    name: "Buscar condição, sigla ou CID-10",
  });
  await field.fill("pressão");
  await page
    .getByRole("combobox", { name: "Área", exact: true })
    .selectOption("Cardiometabólico");
  const hypertension = page.getByRole("link", {
    name: "Hipertensão arterial sistêmica",
  });
  await hypertension.scrollIntoViewIfNeeded();
  const savedScroll = await page.evaluate(() => scrollY);
  await hypertension.click();
  await expect(page).toHaveURL(/#consulta\/tema\/hipertensao$/);
  await page.getByRole("link", { name: "Voltar aos protocolos" }).click();
  await expect(page).toHaveURL(/#consulta$/);
  await expect(field).toHaveValue("pressão");
  await expect(
    page.getByRole("combobox", { name: "Área", exact: true }),
  ).toHaveValue("Cardiometabólico");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(savedScroll);
  await page.goForward();
  await expect(page).toHaveURL(/#consulta\/tema\/hipertensao$/);
  await expect(
    page.getByRole("heading", { name: "Hipertensão arterial sistêmica" }),
  ).toBeVisible();
  await nav.getByRole("link", { name: "Estudo", exact: true }).click();
  await page.getByLabel("Buscar disciplina ou assunto").fill("fisiologia");
  const summary = page.locator(".resource-summary");
  await summary
    .filter({ hasText: "Fisiologia" })
    .locator(":scope > summary")
    .click();
  await page.getByRole("link", { name: "Casos PBL", exact: true }).click();
  await page.goBack();
  await expect(page.getByLabel("Buscar disciplina ou assunto")).toHaveValue(
    "fisiologia",
  );
  await expect(summary.filter({ hasText: "Fisiologia" })).toHaveJSProperty(
    "open",
    true,
  );
  await page.getByRole("link", { name: "Pular para o conteúdo" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#study$/);
  await expect(page.locator("#main")).toBeFocused();
});

test("the small-screen menu and page shortcuts are keyboard accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/#study/enamed");
  const nav = page.getByRole("navigation", { name: "Navegação principal" });
  const menu = nav.getByText("Menu", { exact: true });
  await expect(
    nav.getByRole("link", { name: "Consulta rápida" }),
  ).toBeInViewport();
  await expect(menu).toBeInViewport();
  await menu.click();
  await expect(
    nav.getByRole("link", { name: "Arquivo", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    nav.getByRole("link", { name: "Arquivo", exact: true }),
  ).toBeHidden();
  await expect(menu).toBeFocused();
  await page
    .getByRole("button", { name: "Regras do Enamed", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Quem precisa comprovar proficiência" }),
  ).toBeFocused();
  await expect(page).toHaveURL(/#study\/enamed$/);
  await menu.click();
  await nav.getByRole("link", { name: "Revalida", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Operação Revalida" }),
  ).toBeVisible();
  await expect(
    nav.getByRole("link", { name: "Revalida", exact: true }),
  ).toBeHidden();
  await page
    .getByRole("button", { name: "Mapas por área", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Mapas por área", exact: true }),
  ).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  );
});

test("going back from a round can be cancelled or confirmed without losing the originating page", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Estudo", exact: true }).first().click();
  await page.getByRole("link", { name: "Trilha Enamed", exact: true }).click();
  await page.getByRole("button", { name: "Treinar Clínica Médica" }).click();
  await expect(page).toHaveURL(/#match$/);
  await page.goBack();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page).toHaveURL(/#match$/);
  await page.getByRole("button", { name: "Continuar jogando" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("#pdf-viewer")).toBeVisible();
  await page.goBack();
  await page.getByRole("button", { name: "Encerrar partida" }).click();
  await expect(page).toHaveURL(/#study\/enamed$/);
  await expect(
    page.getByRole("heading", { name: "Preparação para o Enamed" }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#study$/);
});

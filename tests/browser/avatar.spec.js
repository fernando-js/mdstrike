import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const endpoint = (action) => "/api/index.php?action=" + action;

test.beforeAll(() => {
  if (fs.existsSync(".runtime/mdstrike.sqlite")) {
    execFileSync("php", [
      "-r",
      '$db=new PDO("sqlite:.runtime/mdstrike.sqlite"); $db->exec("DELETE FROM md_auth_limits");',
    ]);
  }
});

async function pick(page, category, item) {
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Categoria").selectOption(category);
  await dialog.getByText(item, { exact: true }).click();
  await expect(
    dialog.getByRole("radio", { name: item, exact: true }),
  ).toBeChecked();
}

test("guest previews, cancels and saves an outfit on mobile", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#profile");
  const avatar = page.getByRole("img", { name: "Avatar de Convidado" });
  await expect(avatar.locator('img[src$="/iris.webp"]')).toBeVisible();

  const customize = page.getByRole("button", { name: "Personalizar avatar" });
  await customize.click();
  const dialog = page.getByRole("dialog", { name: "Personalizar avatar" });
  const preview = dialog.getByRole("img", { name: "Prévia do avatar" });
  await pick(page, "cap", "Gorro Aurum");
  await expect(preview.locator('img[src$="/gorro-aurum.webp"]')).toBeVisible();
  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(avatar.locator('img[src$="/gorro-aurum.webp"]')).toHaveCount(0);

  await customize.click();
  await pick(page, "portrait", "Caio");
  await pick(page, "coat", "Jaleco ornamentado");
  await pick(page, "cap", "Gorro Aurum");
  await pick(page, "mask", "Máscara grafite");
  await pick(page, "stethoscope", "Estetoscópio dourado");
  await pick(page, "accessory", "Bisturi de prata");
  const layers = preview.locator("img");
  await expect(layers).toHaveCount(7);
  expect(
    await layers.evaluateAll(async (images) => {
      await Promise.all(images.map((image) => image.decode()));
      return images.every((image) => image.naturalWidth > 0);
    }),
  ).toBe(true);
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
  ).toBe(true);
  await dialog.screenshot({ path: testInfo.outputPath("avatar-mobile.png") });

  await dialog.getByRole("button", { name: "Salvar avatar" }).click();
  await expect(page.getByText("Avatar salvo.")).toBeVisible();
  await expect(avatar.locator("img")).toHaveCount(7);
  await page.reload();
  await expect(avatar.locator("img")).toHaveCount(7);
  await expect(
    avatar.locator('img[src$="/estetoscopio-dourado-auscultador.webp"]'),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("authenticated outfits persist in the account and reject invalid item IDs", async ({
  page,
  playwright,
}, testInfo) => {
  const session = await (await page.request.get(endpoint("session"))).json();
  const suffix = Date.now().toString(36);
  const nickname = "avatar_" + suffix;
  const email = nickname + "@example.test";
  const password = "Avatar-local-tests-123";
  const response = await page.request.post(endpoint("register"), {
    headers: { "X-CSRF-Token": session.csrf },
    data: { nickname, email, password, consent: true },
  });
  expect(response.status()).toBe(201);
  const { csrf, user } = await response.json();
  expect(user.avatar).toMatchObject({ portrait: "iris", coat: "none" });
  const invalid = await page.request.post(endpoint("save-avatar"), {
    headers: { "X-CSRF-Token": csrf },
    data: { ...user.avatar, mask: "gold" },
  });
  expect(invalid.status()).toBe(400);

  await page.goto("/#profile");
  const nicknameField = page.getByLabel("Nickname");
  await nicknameField.fill("Ainda sem salvar");
  await page.getByRole("button", { name: "Personalizar avatar" }).click();
  await pick(page, "portrait", "Luna");
  await pick(page, "coat", "Jaleco branco");
  await pick(page, "stethoscope", "Estetoscópio dourado");
  const dialog = page.getByRole("dialog");
  await dialog
    .locator(".avatar-preview-stage img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => image.decode())),
    );
  await dialog.screenshot({ path: testInfo.outputPath("avatar-desktop.png") });
  await dialog.getByRole("button", { name: "Salvar avatar" }).click();
  await expect(
    page
      .getByRole("img", { name: "Avatar de " + nickname })
      .locator('img[src$="/luna.webp"]'),
  ).toBeVisible();
  await expect(nicknameField).toHaveValue("Ainda sem salvar");

  const secondDevice = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:8088",
  });
  try {
    const secondSession = await (
      await secondDevice.get(endpoint("session"))
    ).json();
    const signedIn = await secondDevice.post(endpoint("login"), {
      headers: { "X-CSRF-Token": secondSession.csrf },
      data: { identity: email, password },
    });
    expect(signedIn.ok()).toBeTruthy();
    expect((await signedIn.json()).user.avatar).toMatchObject({
      portrait: "luna",
      coat: "white",
      stethoscope: "gold",
    });
  } finally {
    await secondDevice.dispose();
  }
});

test("all retratos keep a fitted coat and the two sides of the equipped stethoscope", async ({
  page,
}, testInfo) => {
  const catalog = JSON.parse(
    fs.readFileSync("assets/data/avatar-catalog.json"),
  );
  await page.goto("/#profile");
  await page.getByRole("button", { name: "Personalizar avatar" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("radio")).toHaveCount(12);

  const rendered = [];
  const coatHeights = new Set();
  const stethoscopeHeights = new Set();
  for (const [index, portrait] of catalog.portrait.items.entries()) {
    const alternate = index % 2 === 0;
    await pick(page, "portrait", portrait.name);
    await pick(
      page,
      "coat",
      alternate ? "Jaleco ornamentado" : "Jaleco branco",
    );
    await pick(
      page,
      "stethoscope",
      alternate ? "Estetoscópio dourado" : "Estetoscópio clássico",
    );

    const preview = dialog.locator(".avatar-preview-stage");
    const coat = preview.locator('[data-avatar-slot="coat"]');
    const scope = preview.locator('[data-avatar-slot="stethoscope"]');
    await expect(scope).toHaveCount(2);
    const mask = await preview
      .locator(".avatar-coat-shape")
      .evaluate((node) => getComputedStyle(node).maskImage);
    expect(mask).toContain("/" + portrait.image + ".webp");
    coatHeights.add(await coat.evaluate((image) => image.style.top));
    const [left, right] = await scope.evaluateAll(async (images) => {
      await Promise.all(images.map((image) => image.decode()));
      return images.map((image) => ({
        left: parseFloat(image.style.left),
        top: image.style.top,
      }));
    });
    expect(left.left).toBeLessThan(25);
    expect(right.left).toBeGreaterThan(60);
    stethoscopeHeights.add(left.top);
    rendered.push({
      name: portrait.name,
      html: await preview.evaluate((node) => node.outerHTML),
    });
  }
  expect(coatHeights.size).toBeGreaterThan(8);
  expect(stethoscopeHeights.size).toBeGreaterThan(8);

  const gallery = await page.context().newPage();
  try {
    await gallery.setViewportSize({ width: 960, height: 780 });
    await gallery.goto("/");
    await gallery.setContent(`<!doctype html><html lang="pt-BR"><head><title>Encaixe dos retratos</title><link rel="stylesheet" href="/assets/style.css"></head>
      <body><main style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:12px">${rendered.map(({ name, html }) => `<figure style="margin:0">${html}<figcaption style="text-align:center;margin-top:5px">${name}</figcaption></figure>`).join("")}</main></body></html>`);
    await gallery
      .locator("img")
      .evaluateAll((images) =>
        Promise.all(images.map((image) => image.decode())),
      );
    await gallery.screenshot({
      path: testInfo.outputPath("encaixe-dos-12-retratos.png"),
      fullPage: true,
    });
  } finally {
    await gallery.close();
  }
});

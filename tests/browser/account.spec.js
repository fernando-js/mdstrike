import { expect, test } from "@playwright/test";

test("password controls preserve the typed value and Google signup returns to the invitation", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const challengeId = "a".repeat(32);
  const viewer = {
    id: 123,
    nickname: "AlunoNeurologia",
    email: "student@example.test",
    xp: 0,
    rating: 1000,
    played: 0,
    status: "available",
    isAdmin: false,
  };
  let googleSignupEmail;
  await page.route(
    `**/api/index.php?action=challenge&id=${challengeId}`,
    (route) =>
      route.fulfill({
        json: {
          id: challengeId,
          title: "Desafio de Neurologia",
          creator: "Colega",
          description: "7 questões, 60 segundos por questão.",
          total: 7,
          scores: [],
          mine: "new",
          expired: false,
          expiresAt: 2000000000,
          url: `${new URL(route.request().url()).origin}/d/${challengeId}`,
        },
      }),
  );
  await page.route("**/api/index.php?action=google-register", async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({
      nickname: viewer.nickname,
      consent: true,
    });
    await route.fulfill({ status: 201, json: { user: viewer } });
  });
  await page.route("**/api/index.php?action=profile", (route) =>
    route.fulfill({ json: { user: viewer } }),
  );
  await page.route("**/api/index.php?action=session", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      json: {
        ...(await response.json()),
        googleAuthAvailable: true,
        googleSignupEmail,
      },
    });
  });
  await page.route("**/api/index.php?action=google-start", async (route) => {
    expect(route.request().postDataJSON()).toEqual({});
    await route.fulfill({
      json: {
        url: "https://accounts.google.com/o/oauth2/v2/auth?fixture=mdstrike",
      },
    });
  });
  await page.route(
    "https://accounts.google.com/o/oauth2/v2/auth?fixture=mdstrike",
    async (route) => {
      googleSignupEmail = viewer.email;
      const app = new URL(page.url());
      await route.fulfill({
        status: 303,
        headers: { location: `${app.origin}/#google-auth/signup` },
      });
    },
  );

  await page.goto(`/#challenge/${challengeId}`);
  await expect(
    page.getByRole("heading", { name: "Desafio de Neurologia" }),
  ).toBeVisible();
  await expect(
    page.getByText("Você pode consultar o placar como convidado.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Aceitar desafio" }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Entrar para participar" }).click();
  const dialog = page.locator("#modal");
  await expect(
    dialog.getByRole("button", { name: "Entrar com Google" }),
  ).toBeVisible();
  const password = dialog.getByLabel("Senha", { exact: true });
  await password.fill("senha de teste");
  await dialog.getByRole("button", { name: "Mostrar senha" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(password).toHaveValue("senha de teste");
  await dialog.getByRole("button", { name: "Ocultar senha" }).click();
  await expect(password).toHaveAttribute("type", "password");
  await dialog
    .getByRole("button", { name: "Criar conta", exact: true })
    .click();
  await expect(password).toHaveAccessibleDescription(
    "De 10 a 72 caracteres. Maiúsculas, números e símbolos são opcionais.",
  );
  await expect(password).toHaveAttribute("minlength", "10");
  await page.screenshot({ path: "/private/tmp/mdstrike-cadastro-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    dialog.getByText("Maiúsculas, números e símbolos", { exact: false }),
  ).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({ path: "/private/tmp/mdstrike-cadastro-celular.png" });
  await dialog.getByRole("button", { name: "Criar conta com Google" }).click();
  await expect(
    dialog.getByRole("heading", { name: "Complete seu cadastro" }),
  ).toBeVisible();
  await expect(dialog.getByLabel("E-mail do Google")).toHaveValue(
    googleSignupEmail,
  );
  await expect(dialog.getByRole("checkbox")).not.toBeChecked();
  await expect(dialog.locator('input[type="password"]')).toHaveCount(0);
  await dialog.getByLabel("Nickname", { exact: true }).fill(viewer.nickname);
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(`/#challenge/${challengeId}`);
  await expect(
    page.getByRole("button", { name: "Aceitar desafio" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

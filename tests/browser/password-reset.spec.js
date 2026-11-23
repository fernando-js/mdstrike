import { expect, test } from "@playwright/test";

test("password recovery opens from login and the reset page checks password confirmation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/index.php?action=session", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      json: { ...(await response.json()), passwordResetAvailable: true },
    });
  });
  const message =
    "Se o e-mail estiver associado a uma conta, você receberá um link para redefinir a senha.";
  await page.route(
    "**/api/index.php?action=request-password-reset",
    async (route) => {
      expect(route.request().postDataJSON()).toEqual({
        email: "student@example.test",
      });
      await route.fulfill({ status: 202, json: { message } });
    },
  );
  const token = "a".repeat(64);
  const resetPassword = "New-password-123";
  await page.route("**/api/index.php?action=reset-password", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      token,
      password: resetPassword,
    });
    await route.fulfill({ json: { ok: true, sessionEnded: false } });
  });

  await page.goto("/");
  await page.getByRole("button", { name: /Convidado/i }).click();
  await page.getByRole("button", { name: "Esqueci minha senha" }).click();
  await page.getByLabel("E-mail", { exact: true }).fill("student@example.test");
  await page
    .getByRole("button", { name: "Enviar link de recuperação" })
    .click();
  await expect(page.getByText(message)).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();

  await page.goto("/#reset-password/" + token);
  await expect(
    page.getByRole("heading", { name: "Redefinir senha" }),
  ).toBeFocused();
  const password = page.getByLabel("Nova senha", { exact: true });
  await password.fill(resetPassword);
  const toggle = page.locator('button[aria-controls="reset-password"]');
  await toggle.click();
  await expect(password).toHaveAttribute("type", "text");
  await toggle.click();
  await expect(password).toHaveAttribute("type", "password");
  const confirmation = page.getByLabel("Confirme a nova senha");
  await confirmation.fill("Mistyped-password-321");
  const submit = page.getByRole("button", { name: "Salvar nova senha" });
  await submit.click();
  await expect(page.getByText("As senhas precisam ser iguais.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await confirmation.fill(resetPassword);
  await submit.click();
  await expect(
    page.getByRole("button", { name: "Entrar na conta" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/#lobby$/);
});

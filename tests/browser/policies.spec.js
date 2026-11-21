import { test, expect } from "@playwright/test";

test("privacy and ranking rules have public links and reading them preserves the registration form", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#privacy");
  await expect(page.locator("h1")).toHaveText("Política de privacidade.");
  await expect(page.locator("article.prose")).toContainText("90 dias");
  await expect(
    page.locator('a[href="mailto:info@mdstrike.com"]'),
  ).toBeVisible();
  await expect(page.locator("article.prose")).not.toContainText(
    "fernando.xavierferreira@gmail.com",
  );
  await page.screenshot({
    path: "/private/tmp/mdstrike-privacy-desktop.png",
    fullPage: false,
  });
  await page.locator('footer [href="#ranking-rules"]').click();
  await expect(page.locator("h1")).toHaveText("Regras do ranking.");
  await expect(page.locator("article.prose")).toContainText(
    "conta criada primeiro",
  );
  await expect(page.locator("article.prose")).toContainText(
    "não há sala simultânea",
  );
  await expect(page.locator("article.prose")).toContainText("não soma pontos");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator("h1")).toHaveText("Regras do ranking.");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/private/tmp/mdstrike-ranking-rules-mobile.png",
    fullPage: false,
  });
  await page.goto("/#lobby");
  await page.locator("#account-button").click();
  await page
    .locator("#modal")
    .getByRole("button", { name: "Criar conta", exact: true })
    .click();
  await page
    .locator('#auth-form input[name="email"]')
    .fill("policy-reader@example.test");
  const popupPromise = page.waitForEvent("popup");
  await page.locator('#auth-form a[href="#privacy"]').click();
  const popup = await popupPromise;
  await expect(popup.locator("h1")).toHaveText("Política de privacidade.");
  await popup.close();
  await expect(page.locator('#auth-form input[name="email"]')).toHaveValue(
    "policy-reader@example.test",
  );
  expect(errors).toEqual([]);
});

test("changing map filters never renders a stale response from a previous map", async ({
  page,
}) => {
  await page.goto("/#ranking");
  await page
    .getByRole("button", { name: "Por mapa jogado", exact: true })
    .click();
  const filter = page.locator("#ranking-specialty");
  let releaseOlder;
  const older = new Promise((resolve) => (releaseOlder = resolve));
  let sawOlder;
  const started = new Promise((resolve) => (sawOlder = resolve));
  await page.route(
    "**/api/index.php?action=leaderboard&map=*",
    async (route) => {
      const map = new URL(route.request().url()).searchParams.get("map");
      if (map === "cardiologia") {
        sawOlder();
        await older;
      }
      await route.fulfill({
        json: {
          rows: [
            {
              id: map === "cardiologia" ? 910001 : 910002,
              nickname:
                map === "cardiologia" ? "Placar antigo" : "Placar atual",
              specialty: map,
              rank: "Prata Elite",
              rating: 1000,
              points: 100,
              played: 1,
            },
          ],
          scope: map,
        },
      });
    },
  );
  await filter.selectOption("cardiologia");
  await started;
  await filter.selectOption("neurologia");
  await expect(page.locator("#ranking-content")).toContainText("Placar atual");
  const oldResponse = page.waitForResponse((response) =>
    response.url().includes("map=cardiologia"),
  );
  releaseOlder();
  await (await oldResponse).finished();
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  await expect(page.locator("#ranking-content")).toContainText("Placar atual");
  await expect(page.locator("#ranking-content")).not.toContainText(
    "Placar antigo",
  );
});

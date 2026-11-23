import { expect, test } from "@playwright/test";
import { teaMissions, teaSources } from "../../assets/js/tea-content.js";

test("public TEA page leads to a resumable mission and review removes corrected errors", async ({
  page,
  request,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain(
    "<loc>https://mdstrike.com/tea/</loc>",
  );

  const response = await page.goto("/tea/");
  expect(response.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Título de Especialista em Anestesiologia/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://mdstrike.com/tea/",
  );
  await page.getByRole("link", { name: "Jogar Operação TEA" }).click();
  await expect(page).toHaveURL(/\/#tea$/);
  await expect(
    page.getByRole("heading", { name: "Operação TEA" }),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("tea-desktop.png") });
  await expect(
    page.getByRole("button", { name: "Revisar erros" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Ver missões" }).click();
  await expect(
    page.getByRole("heading", { name: "Missões por tema" }),
  ).toBeFocused();

  const mission = teaMissions[0];
  const card = page.getByRole("article").filter({ hasText: mission.title });
  await card.getByRole("button", { name: "Iniciar missão" }).click();
  const prompt = page.locator(".tea-activity h2");
  const missedPrompt = await prompt.textContent();
  const missed = mission.questions.find(
    ({ prompt }) => prompt === missedPrompt,
  );
  expect(missed).toBeDefined();
  await page
    .getByRole("button", { name: missed.alternatives[0], exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Resposta incorreta", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("link", { name: teaSources[missed.source][0] }),
  ).toHaveAttribute("href", teaSources[missed.source][1]);

  await page.reload();
  await card.getByRole("button", { name: "Retomar missão" }).click();
  await expect(prompt).toHaveText(missedPrompt);
  await expect(
    page.getByRole("heading", { name: "Resposta incorreta", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Próxima questão" }).click();
  for (let step = 1; step < mission.questions.length; step++) {
    const current = await prompt.textContent();
    const question = mission.questions.find(({ prompt }) => prompt === current);
    expect(question).toBeDefined();
    await page
      .getByRole("button", { name: question.correct, exact: true })
      .click();
    await page
      .getByRole("button", {
        name: step === 9 ? "Ver resultado" : "Próxima questão",
      })
      .click();
  }
  await expect(page.getByText("9 de 10 questões corretas")).toBeVisible();
  await page.getByRole("button", { name: "Voltar ao mapa do TEA" }).click();
  await expect(
    card.getByText("10/10 praticadas · 9/10 acertos na última missão"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Revisar erros" }).click();
  await expect(prompt).toHaveText(missedPrompt);
  await page.getByRole("button", { name: missed.correct, exact: true }).click();
  await page.getByRole("button", { name: "Ver resultado" }).click();
  await expect(
    page.getByRole("heading", { name: "Revisão concluída" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voltar ao mapa do TEA" }).click();
  await expect(
    page.getByRole("button", { name: "Revisar erros" }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});

test("mobile TEA case keeps drafts and reveals the next scenario after the answer key", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#tea");
  const title = "Capnograma ausente";
  const card = page.getByRole("article").filter({ hasText: title });
  await card.getByRole("button", { name: "Abrir caso" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: title }),
  ).toBeVisible();
  const response = page.getByRole("textbox");
  await response.fill("É preciso excluir intubação esofágica.");
  await page.reload();
  await card.getByRole("button", { name: "Retomar caso" }).click();
  await expect(response).toHaveValue("É preciso excluir intubação esofágica.");
  await expect(page.getByRole("button", { name: "Ver evolução" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Conferir espelho" }).click();
  await expect(
    page.getByRole("heading", { name: "Espelho comentado" }),
  ).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({ path: testInfo.outputPath("tea-case-mobile.png") });

  await page.getByRole("button", { name: "Ver evolução" }).click();
  await expect(
    page.getByText(/onda de CO₂ de forma consistente/),
  ).toBeVisible();
  await expect(response).toBeEmpty();
  await response.fill("O CO₂ sustentado indica ventilação alveolar.");
  await page.getByRole("button", { name: "Conferir espelho" }).click();
  await page.getByRole("button", { name: "Concluir caso" }).click();
  await expect(
    page.getByRole("heading", { name: "Caso concluído" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voltar ao mapa do TEA" }).click();
  await expect(
    card.getByRole("button", { name: "Refazer caso" }),
  ).toBeVisible();
});

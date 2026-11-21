import { expect, test } from "@playwright/test";
import { themes } from "../../assets/js/medical-quiz-content.js";

test("history and eponym maps provide sourced feedback and separate resumable rounds", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#maps");
  const history = page.getByRole("link", {
    name: "Jogar História da Medicina",
  });
  const eponyms = page.getByRole("link", { name: "Jogar Epônimos" });
  await history.click();
  await expect(
    page.getByRole("heading", { name: themes["historia-medicina"].name }),
  ).toBeVisible();
  await expect(page.getByText("Questão 1 de 10")).toBeVisible();
  const prompt = page.locator("#coding-question");
  const historyPrompt = await prompt.textContent();
  const item = themes["historia-medicina"].questions.find(
    (question) => question.prompt === historyPrompt,
  );
  expect(item).toBeDefined();
  await page.getByRole("radio", { name: item.answer, exact: true }).check();
  await page.getByRole("button", { name: "Confirmar resposta" }).click();
  await expect(
    page.getByRole("heading", { name: "Você acertou" }),
  ).toBeFocused();
  await expect(
    page.getByRole("link", { name: item.source[0], exact: true }),
  ).toHaveAttribute("href", item.source[1]);

  await page.getByRole("link", { name: "Mapas", exact: true }).last().click();
  await eponyms.click();
  await expect(
    page.getByRole("heading", { name: themes.eponimos.name }),
  ).toBeVisible();
  await expect(page.getByText("Questão 1 de 10")).toBeVisible();
  const eponymPrompt = await prompt.textContent();
  const eponym = themes.eponimos.questions.find(
    (question) => question.prompt === eponymPrompt,
  );
  expect(eponym).toBeDefined();
  await page
    .getByRole("radio", { name: eponym.alternatives[0], exact: true })
    .check();
  await page.getByRole("button", { name: "Confirmar resposta" }).click();
  await expect(
    page.getByRole("heading", { name: "Confira a resposta" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: eponym.source[0], exact: true }),
  ).toHaveAttribute("href", eponym.source[1]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({
    path: testInfo.outputPath("mapa-eponimos-mobile.png"),
  });

  await page.goto("/#maps/historia-medicina");
  await expect(prompt).toHaveText(historyPrompt);
  await expect(
    page.getByRole("heading", { name: "Você acertou" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("the calculator catalog filters by clinical area and handles selected units", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#consulta/calculadoras");
  const search = page.getByRole("searchbox", { name: "Buscar calculadora" });
  const filter = page.getByRole("combobox", { name: "Área", exact: true });
  const count = page.locator("[data-resource-count]");
  await expect(count).toHaveText("12 resultados");
  await filter.selectOption("Renal");
  await expect(count).toHaveText("2 resultados");
  await search.fill("filtracao glomerular");
  await expect(count).toHaveText("1 resultado");

  const gfr = page.locator('[data-medical-calculator="ckd-epi-2021"]');
  await gfr.getByLabel("Idade (anos completos)").fill("55");
  await gfr.getByLabel("Creatinina sérica (mg/dL)").fill("0,7");
  await gfr.getByRole("button", { name: "Calcular" }).click();
  const sex = gfr.getByLabel("Sexo para a equação");
  await expect(sex).toHaveAttribute("aria-invalid", "true");
  await sex.selectOption("female");
  await gfr.getByRole("button", { name: "Calcular" }).click();
  await expect(gfr.locator("output")).toHaveText("102,1 mL/min/1,73 m²");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({
    path: testInfo.outputPath("calculadora-renal-mobile.png"),
  });

  await filter.selectOption("Eletrólitos");
  await expect(count).toHaveText("0 resultados");
  await search.fill("ureia");
  const osmolality = page.locator('[data-medical-calculator="osmolalidade"]');
  await osmolality.getByLabel("Sódio sérico (mmol/L)").fill("140");
  await osmolality.getByLabel("Glicemia (mg/dL)").fill("90");
  await osmolality.getByLabel("Exame informado").selectOption("urea");
  await osmolality.getByLabel("Valor da ureia ou do BUN (mg/dL)").fill("59,92");
  await osmolality.getByRole("button", { name: "Calcular" }).click();
  await expect(osmolality.locator("output")).toHaveText("295 mOsm/kg");
  await osmolality.getByLabel("Exame informado").selectOption("bun");
  await expect(osmolality.locator("output")).toBeEmpty();
});

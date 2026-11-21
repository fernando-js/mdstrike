import { expect, test } from "@playwright/test";
import { themes } from "../../assets/js/medical-quiz-content.js";
import {
  medications,
  medicationSources,
} from "../../assets/js/medication-content.js";

test("leaflet lookup opens the selected presentation, preserves context, and links to the official registry", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#consulta");
  await page
    .getByRole("link", { name: "Bulas resumidas", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Bulas resumidas" }),
  ).toBeVisible();
  const query = page.getByRole("searchbox", { name: "Buscar medicamento" });
  const count = page.locator("[data-resource-count]");
  await expect(count).toHaveText("6 resultados");
  await query.fill("sem registro no catálogo");
  await expect(page.getByText(/Nenhuma ficha encontrada/)).toBeVisible();
  const official = page.getByRole("link", {
    name: medicationSources.leaflets[0],
    exact: true,
  });
  await expect(official.first()).toHaveAttribute(
    "href",
    medicationSources.leaflets[1],
  );

  await page
    .getByRole("combobox", { name: "Categoria" })
    .selectOption("Antimicrobianos");
  await query.fill("amoxil");
  await expect(count).toHaveText("1 resultado");
  const amoxil = page.locator("details").filter({ hasText: "Amoxil" });
  await amoxil.locator("summary").click();
  await expect(amoxil.getByText("Amoxil · Cápsulas de 500 mg")).toBeVisible();
  const source = amoxil.getByRole("link", {
    name: medications.amoxicilina.source[0],
  });
  await expect(source).toHaveAttribute(
    "href",
    medications.amoxicilina.source[1],
  );
  await expect(
    page.getByRole("link", { name: medicationSources.registry[0] }),
  ).toHaveAttribute("href", medicationSources.registry[1]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({
    path: testInfo.outputPath("bulas-resumidas-mobile.png"),
    fullPage: true,
  });

  await page.getByRole("link", { name: "Iniciar desafio" }).click();
  await expect(
    page.getByRole("heading", { name: themes.medicamentos.name }),
  ).toBeVisible();
  await expect(page.getByText("Questão 1 de 8")).toBeVisible();
  const prompt = await page.locator("#coding-question").textContent();
  const item = themes.medicamentos.questions.find(
    (question) => question.prompt === prompt,
  );
  expect(item).toBeDefined();
  await page.getByRole("radio", { name: item.answer, exact: true }).check();
  await page.getByRole("button", { name: "Confirmar resposta" }).click();
  await expect(
    page.getByRole("heading", { name: "Você acertou" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: item.source[0], exact: true }),
  ).toHaveAttribute("href", item.source[1]);
  await page.getByRole("link", { name: "Consultar bulas resumidas" }).click();
  await expect(query).toHaveValue("amoxil");
  await expect(amoxil).toHaveAttribute("open", "");
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: "Você acertou" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

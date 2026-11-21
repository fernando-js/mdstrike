import { expect, test } from "@playwright/test";
import { questions } from "../../assets/js/coding-content.js";

const map = "/#maps/codificacao";

test("the coding map runs and resumes a balanced mixed round with explanations", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#maps");
  await page.getByRole("link", { name: "Abrir mapa" }).click();
  await expect(
    page.getByRole("heading", { name: "Codificação em saúde" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /ANS.*202609/ })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("mapa-codificacao-desktop.png"),
  });
  await page
    .getByRole("link", { name: "Iniciar treino · Desafio misto" })
    .click();

  const counts = { cid10: 0, sigtap: 0, tuss: 0 };
  for (let index = 0; index < 9; index += 1) {
    await expect(page.getByText(`Questão ${index + 1} de 9`)).toBeVisible();
    const prompt = await page.locator("#coding-question").textContent();
    const question = questions.find(({ prompt: text }) => text === prompt);
    expect(question).toBeDefined();
    counts[question.system] += 1;
    const answer = page.getByRole("radio", {
      name: question.answer,
      exact: true,
    });
    if (index === 0) {
      const wrong = page
        .locator(".coding-option")
        .filter({ hasNot: answer })
        .first()
        .getByRole("radio");
      await wrong.check();
    } else {
      await answer.check();
    }
    await page.getByRole("button", { name: "Confirmar resposta" }).click();
    const feedback = page.getByRole("heading", {
      name: index === 0 ? "Confira a resposta" : "Você acertou",
    });
    await expect(feedback).toBeFocused();
    await expect(
      page.getByText(question.explanation, { exact: true }),
    ).toBeVisible();
    if (index === 0) {
      await page.reload();
      await expect(feedback).toBeVisible();
      await expect(page.getByText("Questão 1 de 9")).toBeVisible();
    }
    await page
      .getByRole("button", {
        name: index < 8 ? "Próxima questão" : "Ver resultado",
      })
      .click();
  }

  expect(counts).toEqual({ cid10: 3, sigtap: 3, tuss: 3 });
  await expect(
    page.getByRole("heading", { name: "Rodada concluída" }),
  ).toBeVisible();
  await expect(
    page.getByText("Melhor rodada neste navegador · 8/9"),
  ).toBeVisible();
  await page.locator(".coding-review summary").click();
  await expect(page.getByText(/Sua resposta/)).toBeVisible();
  await page.getByRole("link", { name: "Codificação em saúde" }).click();
  await expect(page.getByText("Melhor rodada · 8/9")).toBeVisible();
  expect(errors).toEqual([]);
});

test("lookup handles accents, compact codes and mobile back navigation", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(map);
  await page.getByRole("link", { name: "Consultar códigos" }).click();
  const search = page.getByRole("searchbox", {
    name: "Buscar por código ou termo",
  });
  const table = page.getByRole("combobox", { name: "Tabela", exact: true });
  const results = page.locator("[data-coding-results]");
  await search.fill("e119");
  await expect(results).toContainText("E11.9");
  await search.fill("0211020036");
  await expect(results).toContainText("02.11.02.003-6");
  await search.fill("torax");
  await expect(page.getByText("2 códigos na seleção de treino.")).toBeVisible();
  await search.fill("ECG");
  await expect(results).toContainText("02.11.02.003-6");
  await expect(results).toContainText("40101010");
  await table.selectOption("tuss");
  await expect(results.getByRole("listitem")).toHaveCount(1);
  await expect(results.getByRole("link")).toHaveAttribute(
    "href",
    /gov\.br\/ans/,
  );
  await page.getByRole("link", { name: "Codificação em saúde" }).click();
  await expect(
    page.getByRole("heading", { name: "Codificação em saúde" }),
  ).toBeVisible();
  await page.goForward();
  await expect(search).toHaveValue("ECG");
  await expect(table).toHaveValue("tuss");
  await expect(results).toContainText("40101010");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({
    path: testInfo.outputPath("consulta-codificacao-mobile.png"),
  });
});

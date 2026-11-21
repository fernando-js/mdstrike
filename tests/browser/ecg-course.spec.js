import { expect, test } from "@playwright/test";

const course = "/#study/cursos/ecg";

test("learners reach the ECG course, complete an exercise and use the clinical tracings", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#maps");
  await page.getByLabel("Buscar especialidade").fill("cardiologia");
  await page.locator('[data-map="cardiologia"]').click();
  await page.getByRole("link", { name: "Curso rápido de ECG" }).click();
  await expect(
    page.getByRole("heading", { name: "ECG na prática", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Cursos rápidos" }).click();
  await page.getByRole("link", { name: "Abrir curso de ECG" }).click();
  await page.getByRole("link", { name: "Frequência e ritmo" }).click();
  await page.getByRole("radio", { name: "75 bpm", exact: true }).check();
  await page.getByRole("button", { name: "Conferir resposta" }).click();
  await expect(
    page.getByRole("heading", { name: "Resposta correta" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Resposta correta" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "ECG na prática" }).click();
  await expect(
    page.getByRole("heading", { name: "1 de 6 aulas concluídas" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Arritmias e bloqueios" }).click();
  await expect(
    page.getByRole("combobox", { name: "Derivação" }).locator("option"),
  ).toHaveCount(12);
  await expect(page.getByText(/registro 4117/)).toBeVisible();
  const canvas = page.locator("canvas");
  const first = await canvas.evaluate((element) => element.toDataURL());
  await page.getByRole("combobox", { name: "Derivação" }).selectOption("V1");
  expect(await canvas.evaluate((element) => element.toDataURL())).not.toBe(
    first,
  );
  await page
    .getByRole("combobox", { name: "Janela do registro" })
    .selectOption("6");
  await page.setViewportSize({ width: 390, height: 844 });
  const chart = page.getByRole("region", {
    name: "Traçado com rolagem horizontal",
  });
  const chartWidth = await chart.evaluate((element) => element.scrollWidth);
  await page.getByRole("button", { name: "Ampliar traçado" }).click();
  await expect(
    page.getByRole("button", { name: "Reduzir traçado" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await chart.evaluate((element) => element.scrollWidth),
  ).toBeGreaterThan(chartWidth);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  expect(errors).toEqual([]);
});

test("the six-question challenge resumes and sends mistakes to scheduled reviews", async ({
  page,
}) => {
  await page.goto(course + "/desafio");
  await page.getByRole("radio", { name: "0,25 mV", exact: true }).check();
  await page.getByRole("button", { name: "Próxima", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Questão 2 de 6" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Entregar desafio" }),
  ).toBeDisabled();
  const correct = [
    "60 bpm",
    "Entre 0° e +90°",
    "Bloqueio AV de primeiro grau",
    "O ECG isolado é inconclusivo e deve ser correlacionado ao quadro e à avaliação seriada",
    "Extrassístole ventricular",
  ];
  for (const [index, answer] of correct.entries()) {
    await page.getByRole("radio", { name: answer, exact: true }).check();
    if (index < correct.length - 1)
      await page.getByRole("button", { name: "Próxima", exact: true }).click();
  }
  await page.getByRole("button", { name: "Entregar desafio" }).click();
  await expect(
    page.getByRole("heading", { name: "Resultado do desafio" }),
  ).toBeVisible();
  await expect(page.getByText("5 de 6 questões corretas")).toBeVisible();
  await page.goto("/#study/revisao");
  await expect(page.getByText("1 questão disponível hoje.")).toBeVisible();
  await page.getByRole("link", { name: "Abrir revisões de ECG" }).click();
  await page.getByRole("radio", { name: "1 mV", exact: true }).check();
  await page.getByRole("button", { name: "Conferir resposta" }).click();
  await expect(
    page.getByRole("heading", { name: "Resposta correta" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver fila de revisão" }).click();
  await expect(
    page.getByText("Você concluiu as revisões de hoje."),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Próximas revisões" }),
  ).toBeVisible();
});

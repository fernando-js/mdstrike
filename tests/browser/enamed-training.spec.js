import { expect, test } from "@playwright/test";
import fs from "node:fs";

const data = JSON.parse(fs.readFileSync("app/enamed-training/2025.json"));
const questions = new Map(data.questions.map((item) => [item.number, item]));

test("a guest studies, resumes, reviews mistakes and practices a fresh question on mobile", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/enamed/");
  const start = page.getByRole("link", { name: "Começar treino Enamed" });
  await expect(start).toBeInViewport();
  await start.click();
  await expect(page).toHaveURL(/\/enamed\/treino\/$/);
  await expect(
    page.getByRole("heading", { name: "Questão 1 de 10" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ver página original do Inep" }),
  ).toHaveAttribute("href", /enamed-2025-caderno-1\.pdf#page=4$/);

  const pick = async (letter) => {
    await page.locator('input[name="choice"][value="' + letter + '"]').check();
    await page.getByRole("button", { name: "Conferir resposta" }).click();
  };
  const first = questions.get(data.initial[0]);
  await pick(first.answer === "A" ? "B" : "A");
  await expect(page.locator("#training-feedback")).toContainText(
    "Gabarito oficial " + first.answer,
  );
  await page.reload();
  await expect(page.locator("#training-feedback")).toBeVisible();
  await page.getByRole("button", { name: "Próxima questão" }).click();

  for (const [index, number] of data.initial.entries()) {
    if (!index) continue;
    await pick(questions.get(number).answer);
    await page
      .getByRole("button", {
        name: index === 9 ? "Ver resultado" : "Próxima questão",
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Resultado do treino" }),
  ).toBeFocused();
  await expect(page.getByText("9 de 10 questões corretas")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Acessar conta e trilha de estudo" }),
  ).toBeVisible();
  await page.clock.setFixedTime(new Date(Date.now() + 25 * 60 * 60 * 1000));
  const reviewEvent = page.waitForRequest(
    (request) =>
      request.url().endsWith("/api/enamed-metrics.php") &&
      request.postDataJSON()?.event === "review_7d",
  );
  await page.getByRole("button", { name: "Revisar meus erros (1)" }).click();
  await reviewEvent;
  await expect(page.getByText(first.prompt, { exact: true })).toBeVisible();
  await pick(first.answer);
  await page.getByRole("button", { name: "Ver resultado" }).click();
  await page
    .getByRole("button", { name: "Praticar com novas questões do mesmo tema" })
    .click();
  const related = data.questions.find(
    (item) => item.topic === first.topic && !data.initial.includes(item.number),
  );
  await expect(page.getByText(related.prompt, { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("the aggregate endpoint accepts known same-origin events only", async ({
  request,
}) => {
  const path = "/api/enamed-metrics.php";
  const origin = "http://127.0.0.1:8088";
  expect((await request.get(path)).status()).toBe(405);
  expect(
    (await request.post(path, { data: { event: "first_answer" } })).status(),
  ).toBe(403);
  expect(
    (
      await request.post(path, {
        headers: { Origin: origin },
        data: { event: "first_answer", choice: "A" },
      })
    ).status(),
  ).toBe(400);
  const response = await request.post(path, {
    headers: { Origin: origin },
    data: { event: "first_answer" },
  });
  expect(response.status()).toBe(204);
  expect(response.headers()["set-cookie"]).toBeUndefined();
});

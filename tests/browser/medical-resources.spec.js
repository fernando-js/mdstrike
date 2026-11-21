import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

test("study links expose summaries, schedule recall, and resume case stages", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Estudo Resumos, casos PBL e revisões" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Estudo", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Buscar disciplina ou assunto").fill("fisiologia");
  await expect(
    page.getByRole("status").filter({ hasText: "1 resultado" }),
  ).toBeVisible();
  const summary = page
    .locator(".resource-summary")
    .filter({ hasText: "Débito cardíaco e volume sistólico" });
  await summary.locator(":scope > summary").click();
  await summary.locator(".resource-recall > summary").click();
  await summary.getByRole("button", { name: "Lembrei" }).click();
  await expect(summary.getByRole("status")).toContainText("Próxima revisão:");
  await page
    .getByRole("link", { name: "Minhas revisões", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Próximas revisões" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Fisiologia" })).toBeVisible();

  await page.getByRole("link", { name: "Casos PBL" }).click();
  const caseCard = page.locator('[data-case="tosse-noturna"]');
  await caseCard.locator(":scope > summary").click();
  await expect(
    caseCard.getByRole("heading", { name: "Síntese", exact: true }),
  ).toBeHidden();
  await caseCard.getByRole("button", { name: "Revelar novos dados" }).click();
  await expect(
    caseCard.getByRole("heading", { name: "Novos dados e objetivos" }),
  ).toBeFocused();
  await page.reload();
  await caseCard.locator(":scope > summary").click();
  await caseCard.getByRole("button", { name: "Conferir síntese" }).click();
  await caseCard.getByRole("button", { name: "Concluir caso" }).click();
  await expect(caseCard.locator("[data-case-complete]")).toBeFocused();
  await caseCard.getByRole("link", { name: "Consultar Asma" }).click();
  await expect(page).toHaveURL(/#consulta\/tema\/asma$/);
  await expect(
    page.getByRole("link", { name: "PCDT do SUS · anexo atualizado em 2026" }),
  ).toBeVisible();
});

test("clinical search supports accents, aliases, CID, favorites and the AMB directory", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#consulta");
  await expect(page).toHaveTitle(/MD Strike/);
  const search = page.getByLabel("Buscar condição, sigla ou CID-10");
  await search.fill("pressão alta");
  await expect(
    page.getByRole("heading", { name: "Hipertensão arterial sistêmica" }),
  ).toBeVisible();
  await expect(page.locator("[data-resource-count]")).toHaveText("1 resultado");
  await search.fill("J45.9");
  await expect(
    page.getByRole("heading", { name: "Asma", exact: true }),
  ).toBeVisible();
  const favorite = page.getByRole("button", {
    name: "Favoritar Asma",
    exact: true,
  });
  await favorite.click();
  await page.reload();
  await page.getByRole("checkbox", { name: "Apenas favoritos" }).check();
  await expect(favorite).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-resource-count]")).toHaveText("1 resultado");
  await favorite.click();
  await expect(
    page.getByRole("checkbox", { name: "Apenas favoritos" }),
  ).toBeFocused();
  await expect(
    page.getByText("Nenhum tema neste filtro.", { exact: false }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Fontes brasileiras" }).click();
  await expect(page.locator("[data-resource-count]")).toHaveText(
    "55 resultados",
  );
  await page
    .getByLabel("Buscar especialidade ou sociedade")
    .fill("Cardiologia");
  await expect(
    page.getByRole("link", {
      name: "Sociedade Brasileira de Cardiologia – SBC",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "API de dados abertos de PCDT" }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  expect(errors).toEqual([]);
});

test("calculators accept decimal commas, validate inputs and clear results", async ({
  page,
}) => {
  await page.goto("/#consulta/calculadoras");
  const bmi = page.locator('[data-medical-calculator="imc"]');
  await bmi.getByLabel("Peso (kg)").fill("70,5");
  await bmi.getByLabel("Altura (cm)").fill("175");
  await bmi.getByRole("button", { name: "Calcular" }).click();
  await expect(bmi.locator("output")).toHaveText("23,02 kg/m²");
  await bmi.getByRole("button", { name: "Limpar" }).click();
  await expect(bmi.locator("output")).toBeEmpty();
  await expect(bmi.getByLabel("Peso (kg)")).toBeEmpty();

  const surface = page.locator('[data-medical-calculator="superficie"]');
  await surface.getByLabel("Peso (kg)").fill("72");
  await surface.getByLabel("Altura (cm)").fill("180");
  await surface.getByRole("button", { name: "Calcular" }).click();
  await expect(surface.locator("output")).toHaveText("1,9 m²");

  const pressure = page.locator('[data-medical-calculator="pam"]');
  await pressure.getByLabel("Sistólica (mmHg)").fill("80");
  await pressure.getByLabel("Diastólica (mmHg)").fill("120");
  await pressure.getByRole("button", { name: "Calcular" }).click();
  await expect(pressure.locator("output")).toContainText(
    "sistólica precisa ser maior",
  );
  await pressure.getByLabel("Sistólica (mmHg)").fill("120");
  await pressure.getByLabel("Diastólica (mmHg)").fill("80");
  await pressure.getByRole("button", { name: "Calcular" }).click();
  await expect(pressure.locator("output")).toHaveText("93,3 mmHg");
});

test("Enamed track returns registered users to official practice and their account history", async ({
  page,
  request,
}) => {
  await request.get("/api/index.php?action=session");
  execFileSync("php", [
    "-r",
    '$db = new PDO("sqlite:.runtime/mdstrike.sqlite"); $db->prepare("DELETE FROM md_auth_limits WHERE bucket = ?")->execute([hash("sha256", "register|127.0.0.1")]);',
  ]);
  await page.goto("/enamed/");
  await page.getByRole("link", { name: "Começar a Trilha Enamed" }).click();
  await expect(
    page.getByRole("heading", { name: "Preparação para o Enamed" }),
  ).toBeVisible();
  await expect(page.getByText(/19 de junho de 2026/)).toBeVisible();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  const form = page.locator("#auth-form");
  const suffix = Date.now();
  await form.getByLabel("Nickname", { exact: true }).fill("trilha_" + suffix);
  await form
    .getByLabel("E-mail", { exact: true })
    .fill(`trilha${suffix}@example.test`);
  await form.getByLabel("Senha").fill("Enamed-2026-local-test-01");
  await form.getByRole("checkbox").check();
  await form.getByRole("button", { name: "Criar meu operador" }).click();
  await expect(page).toHaveURL(/#study\/enamed$/);
  await expect(
    page.getByRole("button", { name: "Sair da conta" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Treinar Clínica Médica" }),
  ).toBeVisible();
  await page.reload();
  const matchResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("action=start-match") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Treinar Clínica Médica" }).click();
  const match = await matchResponse;
  expect(match.status()).toBe(200);
  expect((await match.json()).question).toMatchObject({
    area: "CM",
    exam: "enamed-2025",
  });
  await expect(page).toHaveURL(/#match$/);
  await expect(page.locator("#pdf-viewer")).toBeVisible();
  await page.locator("[data-answer]").first().click();
  await expect(page.locator(".feedback")).toBeVisible();
  await page
    .getByRole("button", { name: "Sair da partida", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Encerrar partida", exact: true })
    .click();
  await expect(page).toHaveURL(/#lobby$/);
  await page.goto("/#study/enamed");
  await page.reload();
  await expect(
    page.getByText(/1 resposta · menor acerto até agora/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sair da conta", exact: true })
    .click();
  await expect(page).toHaveURL(/#lobby$/);
  await page.goto("/#study/enamed");
  await page.getByRole("button", { name: "Treinar Pediatria" }).click();
  await expect(page).toHaveURL(/#match$/);
  await expect(page.locator("#pdf-viewer")).toBeVisible();
});

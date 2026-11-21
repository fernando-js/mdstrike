import { test, expect } from "@playwright/test";

const root = "/enamed/resultados/";
const list = ".enamed-results-table";

test("public results, course and CSV provide source attribution and canonical HTML without JavaScript", async ({
  request,
}) => {
  const index = await request.get("/enamed/");
  expect(await index.text()).toContain('href="/enamed/resultados/"');
  const response = await request.get(root + "?q=1439");
  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  expect(html).toContain("https://mdstrike.com/enamed/resultados/");
  expect(html).toContain("UNIVERSIDADE FEDERAL DE UBERLÂNDIA");
  expect(html).toContain("90,3%");
  expect(html).toContain("07/07/2026");
  expect(html).toContain('href="/enamed/resultados/curso/1439/"');
  const course = await request.get(root + "curso/1439/");
  expect(course.ok()).toBeTruthy();
  expect(await course.text()).toContain(
    'rel="canonical" href="https://mdstrike.com/enamed/resultados/curso/1439/"',
  );
  const suspended = await request.get(root + "curso/49060/");
  expect(await suspended.text()).toContain("suspensão judicial");
  expect((await request.get(root + "curso/999999999/")).status()).toBe(404);
  const csv = await request.get(root + "dados.csv?q=1439");
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(csv.headers()["content-disposition"]).toContain(
    "mdstrike-enamed-2025.csv",
  );
  const body = await csv.text();
  expect(body.trim().split("\n")).toHaveLength(2);
  expect(body).toContain("90,3");
  expect(body).toContain("2026-07-07");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain(
    "<loc>https://mdstrike.com/enamed/resultados/curso/1439/</loc>",
  );
  expect(sitemap).not.toContain("/enamed/resultados/comparar/");
  expect(sitemap).not.toContain("/enamed/resultados/dados.csv");
});

test("search filters, pagination and comparison work across the course directory", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(root);
  await expect(
    page.getByRole("heading", { name: "Resultados do Enamed 2025" }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("enamed-resultados-desktop.png"),
  });
  const firstRows = page.locator(list + " tbody tr");
  await expect(firstRows).toHaveCount(20);
  await firstRows.first().getByRole("checkbox").check();
  await expect(page.locator("#enamed-selected-summary")).toContainText(
    "1 de 3",
  );
  const next = page
    .getByRole("navigation", { name: "Páginas de resultados" })
    .getByRole("link", { name: "Próxima" });
  await next.click();
  await expect(page.locator("#enamed-selected-summary")).toContainText(
    "1 de 3",
  );
  await page
    .locator(list + " tbody tr")
    .first()
    .getByRole("checkbox")
    .check();
  await page
    .locator(list + " tbody tr")
    .nth(1)
    .getByRole("checkbox")
    .check();
  await expect(
    page
      .locator(list + " tbody tr")
      .nth(2)
      .getByRole("checkbox"),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Comparar cursos" }).click();
  await expect(page).toHaveURL(/resultados\/comparar\/\?cursos=/);
  await expect(page.locator(".enamed-compare-results thead th")).toHaveCount(4);
  await expect(
    page.locator(".enamed-compare-results").getByText("NPS do curso"),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("enamed-comparacao.png") });

  await page.getByRole("link", { name: "Voltar à busca" }).click();
  await page.getByRole("button", { name: "Limpar seleção" }).click();
  await expect(page.locator("#enamed-selected-summary")).toContainText(
    "Selecione",
  );
  await page.getByLabel("UF", { exact: true }).selectOption("MG");
  const cityLabels = await page
    .getByLabel("Município", { exact: true })
    .locator("option")
    .allTextContents();
  expect(cityLabels.length).toBeGreaterThan(3);
  expect(cityLabels.slice(1).every((label) => label.endsWith("/MG"))).toBe(
    true,
  );
  await page
    .getByRole("searchbox", { name: "Buscar", exact: true })
    .fill("Uberlandia");
  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  await expect(page.locator(list + " tbody tr")).toHaveCount(1);
  await expect(page.locator(list)).toContainText("90,3%");
  await page
    .locator(list)
    .getByRole("link", { name: "UNIVERSIDADE FEDERAL DE UBERLÂNDIA" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Distribuição das notas" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Referências de desempenho" }),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("enamed-curso.png") });
  expect(errors).toEqual([]);
});

test("results and comparison lay out on a narrow screen", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    root,
    root + "?q=1439#cursos",
    root + "curso/1439/",
    root + "comparar/?cursos=1439,12,140",
  ]) {
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto(root + "?q=1439#cursos");
  await expect(
    page
      .locator(list)
      .getByRole("link", { name: "UNIVERSIDADE FEDERAL DE UBERLÂNDIA" }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("enamed-resultados-mobile.png"),
  });
});

import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/medicina/",
  "/consulta-clinica/",
  "/exames-medicos/",
  "/exames-medicos/eletrocardiograma/",
  "/codificacao-em-saude/",
  "/cid-10/",
  "/cid-10/i10/",
  "/cid-10/e119/",
  "/cid-10/r074/",
  "/cid-10/j459/",
  "/cid-10/n390/",
];

test.use({ javaScriptEnabled: false });

test("medical pages have distinct crawlable content, canonical URLs and sitemap entries", async ({
  page,
  request,
}) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const xml = await sitemap.text();
  const titles = new Set();
  for (const path of publicRoutes) {
    const response = await page.goto(path);
    expect(response.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://mdstrike.com" + path,
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /[A-Za-z].{40,}/,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    titles.add(await page.title());
    expect(xml).toContain("<loc>https://mdstrike.com" + path + "</loc>");
  }
  expect(titles.size).toBe(publicRoutes.length);
  expect(xml).not.toContain("/cid-10/?q=");
  expect(xml).not.toContain("/cid-10/e11/");
  const redirect = await request.get("/cid-10/E11.9", { maxRedirects: 0 });
  expect(redirect.status()).toBe(301);
  expect(redirect.headers().location).toBe("/cid-10/e119/");
  expect((await request.get("/cid-10/AAA/")).status()).toBe(404);
  expect((await request.get("/cid-10/a00/")).status()).toBe(404);
});

test("CID-10 searches by name or code and stays usable on mobile without JavaScript", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/cid-10/");
  const input = page.getByRole("searchbox", { name: "Código ou nome" });
  const search = page.getByRole("button", { name: "Buscar" });
  await input.fill("pressao alta");
  await search.click();
  await expect(
    page.getByRole("link", { name: /I10 Hipertensão/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /I15 Hipertensão/ }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex,follow",
  );
  await input.fill("e119");
  await search.click();
  await expect(page.getByRole("link", { name: /^E11\.9 / })).toBeVisible();
  await page.getByRole("link", { name: /^E11\.9 / }).click();
  await expect(
    page.getByRole("heading", { name: /CID-10 E11\.9/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: /^E11 ·/ }).click();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex,follow",
  );
  await page.goto("/cid-10/?q=A00");
  await expect(page.getByText(/Nenhum termo encontrado/)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /lista completa/ }),
  ).toHaveAttribute("href", /fhir\.saude\.gov\.br/);
  await page.goto("/cid-10/?q=cefaleia");
  await expect(page.getByRole("link", { name: /R51/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({ path: testInfo.outputPath("cid10-mobile.png") });
});

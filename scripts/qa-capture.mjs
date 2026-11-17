import { chromium } from "playwright";
import fs from "node:fs";
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1536, height: 1040 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8088");
await page.waitForSelector(".operation");
await page.evaluate(() => document.fonts.ready);
await page.screenshot({
  path: "/private/tmp/mdstrike-lobby-desktop.png",
  fullPage: true,
});
console.log(
  JSON.stringify({
    title: await page.title(),
    heading: await page.locator("h1").textContent(),
    errors,
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  }),
);
await page.getByRole("button", { name: "Mapas", exact: true }).click();
await page.locator("#map-search").fill("Cardiologia");
await page.locator('[data-map="cardiologia"]').click();
await page.screenshot({ path: "/private/tmp/mdstrike-map-modal.png" });
await page.locator("[data-close]").click();
await page.getByRole("button", { name: "Jogar", exact: true }).click();
await page.getByRole("button", { name: "Iniciar treino" }).click();
await page.waitForSelector(".answer");
await page.screenshot({
  path: "/private/tmp/mdstrike-game-desktop.png",
  fullPage: true,
});
await page.locator('[data-answer="0"]').click();
await page.waitForSelector(".feedback");
await page.screenshot({
  path: "/private/tmp/mdstrike-game-feedback.png",
  fullPage: true,
});
const booklet = await browser.newPage({
  viewport: { width: 1536, height: 1040 },
});
await booklet.goto("http://127.0.0.1:8088/#archive");
await booklet.locator('[data-exam="enamed-2025"]').click();
await booklet.locator('#pdf-viewer[data-ready="true"]').waitFor();
await booklet.screenshot({
  path: "/private/tmp/mdstrike-official-local.png",
  fullPage: true,
});
const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  deviceScaleFactor: 1,
});
await mobile.goto("http://127.0.0.1:8088");
await mobile.waitForSelector(".operation");
await mobile.evaluate(() => document.fonts.ready);
await mobile.screenshot({
  path: "/private/tmp/mdstrike-lobby-mobile.png",
  fullPage: true,
});
console.log(
  "Mobile overflow:",
  await mobile.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  ),
);
const favicon = await browser.newPage({
  viewport: { width: 180, height: 180 },
  deviceScaleFactor: 1,
});
const svg = fs.readFileSync("assets/favicon.svg", "utf8");
await favicon.setContent(
  `<style>html,body{margin:0;width:100%;height:100%;background:transparent}svg{display:block;width:100%;height:100%}</style>${svg}`,
);
await favicon.screenshot({
  path: "assets/apple-touch-icon.png",
  omitBackground: true,
});
await favicon.setViewportSize({ width: 32, height: 32 });
await favicon.screenshot({
  path: "assets/favicon-32.png",
  omitBackground: true,
});
const png = fs.readFileSync("assets/favicon-32.png");
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = 32;
header[7] = 32;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18);
fs.writeFileSync("favicon.ico", Buffer.concat([header, png]));
console.log("Favicons created. Browser errors:", errors);
await browser.close();

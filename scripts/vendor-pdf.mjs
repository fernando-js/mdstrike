import fs from "node:fs";
const source = "node_modules/pdfjs-dist",
  target = "assets/pdfjs";
fs.mkdirSync(target, { recursive: true });
for (const file of ["pdf.min.mjs", "pdf.worker.min.mjs"])
  fs.copyFileSync(`${source}/build/${file}`, `${target}/${file}`);
fs.cpSync(`${source}/standard_fonts`, `${target}/standard_fonts`, {
  recursive: true,
});
fs.copyFileSync(`${source}/LICENSE`, `${target}/LICENSE`);
console.log("PDF.js reader and fonts copied into public assets.");

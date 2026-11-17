import fs from "node:fs";
import { execFileSync } from "node:child_process";
for (const file of ["app/bootstrap.php", "app/challenges.php", "app/admin.php", "api/index.php", "scripts/router.php"])
  execFileSync("php", ["-l", file], { stdio: "inherit" });
for (const file of fs.readdirSync("assets/js").filter((f) => f.endsWith(".js")))
  execFileSync("node", ["--check", `assets/js/${file}`], { stdio: "inherit" });
const bank = JSON.parse(fs.readFileSync("app/questions.json"));
const catalog = JSON.parse(fs.readFileSync("app/catalog.json"));
if (catalog.specialties.length !== 55)
  throw new Error("Expected 55 specialties");
if (new Set(bank.map((q) => q.id)).size !== bank.length)
  throw new Error("Question IDs must be unique");
for (const q of bank) {
  if (
    q.answer !== null &&
    (!Number.isInteger(q.answer) ||
      q.answer < 0 ||
      q.answer >= q.options.length)
  )
    throw new Error(`Invalid answer ${q.id}`);
  if (q.kind === "official" && !fs.existsSync(q.pdf))
    throw new Error(`Missing PDF ${q.id}`);
}
for (const e of catalog.exams) {
  const questions = bank.filter((q) => q.exam === e.id);
  if (
    questions.length !== e.total ||
    questions.filter((q) => q.answer !== null).length !== e.valid
  )
    throw new Error(`Invalid booklet counts: ${e.id}`);
}
console.log(
  `Validated ${catalog.specialties.length} maps, ${catalog.exams.length} official booklets and ${bank.length} question records.`,
);

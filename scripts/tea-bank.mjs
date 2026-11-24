import { readFileSync, writeFileSync } from "node:fs";
import { teaMissions, teaSources } from "../assets/js/tea-content.js";

const bankPath = new URL("../app/tea-questions.json", import.meta.url);
const bank = teaMissions.flatMap(({ questions }) =>
  questions.map(
    ({ id, point, source, prompt, correct, alternatives, explanation }) => ({
      id: `tea-${id}`,
      area: "CIR",
      kind: "original",
      reviewed: false,
      point,
      source: teaSources[source][0],
      sourceUrl: teaSources[source][1],
      prompt,
      options: [correct, ...alternatives],
      answer: 0,
      explanation,
    }),
  ),
);

if (new Set(bank.map(({ id }) => id)).size !== bank.length)
  throw new Error("Duplicate TEA question IDs");

const contents = JSON.stringify(bank, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if (readFileSync(bankPath, "utf8") !== contents)
    throw new Error(
      "TEA question bank is out of date. Run node scripts/tea-bank.mjs.",
    );
} else {
  writeFileSync(bankPath, contents);
}

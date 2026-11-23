import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const [selectionFile, keyFile, flag] = process.argv.slice(2);
if (!selectionFile || !keyFile || (flag && flag !== "--check")) {
  throw new Error(
    "Uso: node scripts/import-enamed-training.mjs <seleção.json> <gabarito.pdf> [--check]",
  );
}

const root = new URL("../", import.meta.url);
const selection = JSON.parse(await fs.readFile(selectionFile, "utf8"));
const letters = ["A", "B", "C", "D"];

function officialPdf(value) {
  const url = new URL(value);
  assert.equal(url.origin, "https://download.inep.gov.br");
  assert.match(url.pathname, /^\/enamed\/.*\.pdf$/i);
}

async function readPages(path) {
  const data = new Uint8Array(await fs.readFile(path));
  const task = getDocument({ data, verbosity: 0 });
  try {
    const pdf = await task.promise;
    const pages = [];
    for (let index = 1; index <= pdf.numPages; index++) {
      const { items } = await (await pdf.getPage(index)).getTextContent();
      pages.push(
        items.map((item) => item.str + (item.hasEOL ? "\n" : " ")).join(""),
      );
    }
    return pages;
  } finally {
    await task.destroy();
  }
}

assert.match(selection.edition, /^20\d{2}$/);
assert.match(
  selection.paper,
  /^\/assets\/documents\/enamed-\d{4}-caderno-\d+\.pdf$/,
);
assert.ok(
  selection.paper.startsWith(
    "/assets/documents/enamed-" + selection.edition + "-",
  ),
);
assert.match(selection.keyStatus, /^Definitivo(?: v\d+)?$/);
assert.ok(selection.title.includes(selection.edition));
officialPdf(selection.originalUrl);
officialPdf(selection.key);

const [paperPages, keyPages] = await Promise.all([
  readPages(new URL("." + selection.paper, root)),
  readPages(keyFile),
]);
const pageByQuestion = new Map();
paperPages.forEach((page, index) => {
  for (const [, raw] of page.matchAll(/\bQUEST[ÃA]O\s+(\d{1,3})\b/giu)) {
    const number = Number(raw);
    if (number >= 1 && number <= 100 && !pageByQuestion.has(number)) {
      pageByQuestion.set(number, index + 1);
    }
  }
});
const keyText = keyPages.join("\n");
assert.ok(
  /\bDEFINITIVO\b/iu.test(keyText),
  "O PDF precisa identificar o gabarito como definitivo.",
);
assert.ok(
  !/\bGABARITO\s+PRELIMINAR\b/iu.test(keyText),
  "Gabarito preliminar não aceito.",
);
const bookletNumber = Number(selection.paper.match(/-caderno-(\d+)\.pdf$/)[1]);
const keyBooklets = Array.from(
  keyText.matchAll(/\bCADERNO\s+(\d{1,2})\b/giu),
  ([, value]) => Number(value),
);
assert.ok(
  keyBooklets.length && keyBooklets.every((value) => value === bookletNumber),
  "O gabarito e o caderno precisam usar o mesmo número.",
);
const answerByQuestion = new Map();
for (const [, raw, value] of keyText.matchAll(
  /\b(\d{1,3})\s+(Anulada|Excluída|[ABCD])(?=\s|[*.,]|$)/gu,
)) {
  const number = Number(raw);
  assert.ok(
    !answerByQuestion.has(number),
    "Entrada duplicada no gabarito: " + number,
  );
  answerByQuestion.set(number, letters.includes(value) ? value : null);
}
for (let number = 1; number <= 100; number++) {
  assert.ok(
    pageByQuestion.has(number),
    "Questão sem página no caderno: " + number,
  );
  assert.ok(
    answerByQuestion.has(number),
    "Questão sem entrada no gabarito: " + number,
  );
}

const catalog = JSON.parse(
  await fs.readFile(new URL("app/catalog.json", root), "utf8"),
);
const numberList = selection.questions.map((item) => item.number);
assert.equal(
  new Set(numberList).size,
  numberList.length,
  "Questões repetidas na seleção",
);
assert.equal(selection.initial.length, 10);
assert.equal(new Set(selection.initial).size, selection.initial.length);
for (const number of selection.initial) {
  const selected = selection.questions.find((item) => item.number === number);
  assert.ok(selected, "Questão inicial ausente da seleção: " + number);
  assert.ok(
    selection.questions.some(
      (item) =>
        item.topic === selected.topic &&
        !selection.initial.includes(item.number),
    ),
    "Tema sem questão de reforço: " + selected.topic,
  );
}
const questions = selection.questions.map((item) => {
  const page = pageByQuestion.get(item.number);
  const answer = answerByQuestion.get(item.number);
  assert.ok(page && answer, "Questão indisponível ou excluída: " + item.number);
  assert.ok(catalog.areas[item.area] && item.area !== "GERAL");
  assert.ok(item.prompt.trim() && item.topic.trim());
  assert.equal(item.options.length, letters.length);
  assert.ok(item.options.every((option) => option.trim()));
  if (item.comment) {
    for (const field of ["clue", "distractor", "sourceLabel"])
      assert.ok(item.comment[field].trim());
    assert.equal(new URL(item.comment.source).protocol, "https:");
    assert.equal(
      Boolean(item.comment.reviewedBy),
      Boolean(item.comment.reviewedAt),
    );
    if (item.comment.reviewedAt)
      assert.match(item.comment.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
  }
  if (flag === "--check") {
    assert.equal(
      item.page,
      page,
      "Página diferente do caderno: " + item.number,
    );
    assert.equal(
      item.answer,
      answer,
      "Resposta diferente do gabarito: " + item.number,
    );
  }
  return { ...item, page, answer };
});

if (flag !== "--check") {
  const destination = new URL(
    "app/enamed-training/" + selection.edition + ".json",
    root,
  );
  const temporary = new URL(destination.href + "." + process.pid + ".tmp");
  await fs.writeFile(
    temporary,
    JSON.stringify({ ...selection, questions }, null, 2) + "\n",
    { flag: "wx" },
  );
  try {
    await fs.rename(temporary, destination);
  } finally {
    await fs.rm(temporary, { force: true });
  }
  console.log("Edição importada em " + fileURLToPath(destination));
}
console.log(
  questions.length +
    " questões conferidas com o caderno e o gabarito definitivo.",
);

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const sourceBase = "https://download.inep.gov.br/revalida/provas_e_gabaritos/";
const archive =
  "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida/provas-e-gabaritos";
const documents = "assets/documents";
const editions = [
  {
    id: "2026-1",
    paper: "2026_1_caderno_1_.pdf",
    key: "2026_1_gabarito_definitivo_caderno1.pdf",
    cutoff: 59,
    scoringSource: "https://mecnormas.mec.gov.br/pesquisa/detalhar/9045",
  },
  {
    id: "2025-2",
    paper: "2025_2_caderno_1_preliminar.pdf",
    key: "2025_2_gabarito_caderno_1.pdf",
    cutoff: 61,
    creditCancelled: true,
    scoringSource:
      "https://www.gov.br/inep/pt-br/centrais-de-conteudo/legislacao/revalida/2025",
  },
  {
    id: "2025-1",
    paper: "2025_1_PV_objetiva_regular.pdf",
    key: "2025_1_GB_objetiva_definitivo.pdf",
    writtenStage: true,
  },
  {
    id: "2024-2",
    paper: "2024_2_PV_objetiva_regular.pdf",
    key: "2024_2_GB_objetiva.pdf",
    writtenStage: true,
  },
  {
    id: "2024-1",
    paper: "2024_1_PV_objetiva_regular.pdf",
    key: "2024_1_GB_objetiva.pdf",
    writtenStage: true,
  },
];

// Editorial tags for the 2026/1 objective paper. The question's subject takes
// precedence over the location of the consultation in interdisciplinary cases.
const areas = {
  CM: [1, 5, 8, 24, 26, 29, 36, 41, 46, 56, 58, 65, 71, 72, 91, 96],
  CIR: [3, 6, 10, 17, 31, 38, 48, 53, 57, 60, 67, 81, 88, 90, 93, 98],
  GO: [
    4, 11, 18, 19, 25, 32, 39, 43, 44, 45, 49, 50, 54, 55, 61, 68, 75, 76, 82,
    89, 94, 99,
  ],
  PED: [2, 9, 15, 21, 23, 30, 37, 42, 47, 52, 59, 66, 73, 80, 87, 92, 97, 100],
  MFC: [12, 22, 40, 51, 62, 70, 74, 78, 79, 84, 86, 95],
  SM: [7, 14, 28, 35, 64, 69, 85],
  SC: [13, 16, 20, 27, 33, 34, 63, 77, 83],
};
const areaByNumber = new Map(
  Object.entries(areas).flatMap(([area, nums]) =>
    nums.map((num) => [num, area]),
  ),
);
assert.equal(areaByNumber.size, 100, "Every 2026/1 item needs one area");

async function readPages(path, url) {
  let bytes;
  try {
    bytes = await fs.readFile(path);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
    if (!response.ok)
      throw new Error(`PDF unavailable: ${url} (${response.status})`);
    bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
    await fs.writeFile(path, bytes);
  }
  const loading = getDocument({ data: new Uint8Array(bytes), verbosity: 0 });
  const pdf = await loading.promise;
  try {
    const pages = [];
    for (let page = 1; page <= pdf.numPages; page++) {
      const { items } = await (await pdf.getPage(page)).getTextContent();
      pages.push(
        items.map((item) => item.str + (item.hasEOL ? "\n" : " ")).join(""),
      );
    }
    return pages;
  } finally {
    await loading.destroy();
  }
}

function parseKey(pages, edition) {
  const text = pages.join("\n");
  assert.match(
    text,
    /DEFINITIVO|\u0018ĞĨŝŶŝƚŝǀŽ/iu,
    `${edition} needs a definitive key`,
  );
  const answers = new Map();
  function set(number, answer) {
    assert.ok(!answers.has(number), `Duplicate in ${edition}: ${number}`);
    answers.set(
      number,
      "ABCD".includes(answer) ? "ABCD".indexOf(answer) : null,
    );
  }
  if (edition === "2026-1") {
    // This PDF's embedded font maps the digits and answer letters to these
    // glyphs. Keep the conversion scoped to this exact file's key entries.
    const glyphs = {
      "\u0004": "A",
      "\u0011": "B",
      "\u0012": "C",
      "\u0018": "D",
    };
    for (const [, digits, letter] of text.matchAll(
      /([Ϭ-ϵ]{1,3})\s+[\s\u0003]*([\u0004\u0011\u0012\u0018])/gu,
    )) {
      const number = Number(
        Array.from(digits, (digit) => digit.codePointAt(0) - 0x3ec).join(""),
      );
      set(number, glyphs[letter]);
    }
  } else if (edition === "2025-2") {
    for (const [, number, answer] of text.matchAll(
      /\b(\d{1,3})\s+(Anulada|[ABCD])(?=\s|$)/gu,
    ))
      set(Number(number), answer);
  } else {
    for (const [, numbers, values] of text.matchAll(
      /Questão\s+([\d\s]+)Gabarito\s+([^\n]+)/gu,
    )) {
      const ids = numbers.trim().split(/\s+/u).map(Number);
      const options = values.trim().split(/\s+/u);
      assert.equal(ids.length, options.length, `Invalid key row: ${edition}`);
      options.forEach((answer, i) => {
        assert.match(answer, /^[ABCD—\-\u0336]$/u);
        set(ids[i], answer);
      });
    }
  }
  assert.equal(answers.size, 100, `${edition} key completeness`);
  for (let n = 1; n <= 100; n++)
    assert.ok(answers.has(n), `Missing key: ${edition} question ${n}`);
  return answers;
}

function questionPages(pages, edition) {
  const found = new Map();
  pages.forEach((page, index) => {
    for (const [, number] of page.matchAll(/QUEST[ÃA]O\s*(\d{1,3})\b/giu)) {
      const n = Number(number);
      if (n >= 1 && n <= 100 && !found.has(n)) found.set(n, index + 1);
    }
  });
  for (let n = 1; n <= 100; n++)
    assert.ok(found.has(n), `Missing page: ${edition} question ${n}`);
  return found;
}

const exams = [],
  questions = [];
for (const edition of editions) {
  const year = edition.id.replace("-", "/"),
    id = `revalida-${edition.id}`;
  const pdf = `${documents}/${id}.pdf`,
    keyPdf = `${documents}/${id}-gabarito.pdf`;
  const originalUrl = sourceBase + edition.paper,
    key = sourceBase + edition.key;
  const [paper, keyPages] = await Promise.all([
    readPages(pdf, originalUrl),
    readPages(keyPdf, key),
  ]);
  const pages = questionPages(paper, edition.id),
    answers = parseKey(keyPages, edition.id);
  const cancelled = Array.from(answers)
    .filter(([, answer]) => answer === null)
    .map(([n]) => n)
    .sort((a, b) => a - b);
  const title = `Revalida ${year} · Prova objetiva`,
    source = `Inep · ${title}`;
  exams.push({
    id,
    title,
    exam: "REVALIDA",
    year,
    area: "GERAL",
    specialty: "",
    operation: "revalida",
    source,
    pdf,
    originalUrl,
    key,
    keyPdf,
    archive: `${archive}/${year.slice(0, 4)}`,
    total: 100,
    valid: 100 - cancelled.length,
    keyStatus: "Definitivo",
    cancelled,
    durationMinutes: 300,
    ...(edition.writtenStage ? { writtenStage: true } : {}),
    ...(edition.creditCancelled ? { creditCancelled: true } : {}),
    ...(edition.cutoff
      ? { cutoff: edition.cutoff, scoringSource: edition.scoringSource }
      : {}),
  });
  for (let number = 1; number <= 100; number++) {
    questions.push({
      id: `${id}-q${number}`,
      area: edition.id === "2026-1" ? areaByNumber.get(number) : "GERAL",
      specialties: [],
      prompt: `Questão ${number} · ${title}`,
      options: [..."ABCD"],
      answer: answers.get(number),
      explanation: "Correção pelo gabarito definitivo do Inep.",
      source,
      kind: "official",
      reviewed: true,
      operation: "revalida",
      exam: id,
      number,
      pdf,
      page: pages.get(number),
      key,
    });
  }
  console.log(
    `${title}: ${100 - cancelled.length} questões válidas, ${cancelled.length} anuladas`,
  );
}
await fs.writeFile(
  "app/revalida-exams.json",
  JSON.stringify(exams, null, 2) + "\n",
);
await fs.writeFile(
  "app/revalida-questions.json",
  JSON.stringify(questions, null, 2) + "\n",
);

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const bank = JSON.parse(fs.readFileSync("app/questions.json"));
const catalog = JSON.parse(fs.readFileSync("app/catalog.json"));

test("official booklets preserve answer-key exclusions and source page references", () => {
  assert.equal(catalog.exams.length, 28);
  for (const exam of catalog.exams) {
    const items = bank.filter((q) => q.exam === exam.id);
    assert.equal(items.length, exam.total);
    assert.equal(new Set(items.map((q) => q.number)).size, exam.total);
    assert.equal(items.filter((q) => q.answer !== null).length, exam.valid);
    assert.deepEqual(
      items
        .filter((q) => q.answer === null)
        .map((q) => q.number)
        .sort((a, b) => a - b),
      [...exam.cancelled].sort((a, b) => a - b),
    );
    assert.ok(
      items.every(
        (q) => q.page >= 1 && q.pdf === exam.pdf && q.source === exam.source,
      ),
    );
    assert.ok(fs.existsSync(exam.pdf));
  }
});

test("all specialty map counts match their actual content", () => {
  assert.equal(catalog.specialties.length, 55);
  for (const map of catalog.specialties) {
    assert.equal(
      map.questions,
      bank.filter((q) => q.specialties.includes(map.id) && q.answer !== null)
        .length,
    );
    assert.equal(
      map.originals,
      bank.filter(
        (q) => q.specialties.includes(map.id) && q.kind === "original",
      ).length,
    );
    assert.ok(map.foundationQuestions > 0);
    assert.ok(catalog.areas[map.area]);
  }
});

test("each Enamed 2025 area has official questions with a definitive answer", () => {
  const enamed = bank.filter(
    (q) => q.exam === "enamed-2025" && q.answer !== null,
  );
  assert.ok(enamed.every((q) => q.kind === "official" && q.area !== "GERAL"));
  assert.deepEqual(
    new Set(enamed.map((q) => q.area)),
    new Set(Object.keys(catalog.areas).filter((id) => id !== "GERAL")),
  );
});

test("demonstration questions are never labelled official or medically reviewed", () => {
  const originals = bank.filter((q) => q.kind === "original");
  assert.equal(originals.length, 54);
  assert.ok(originals.every((q) => q.reviewed === false && !q.exam));
});

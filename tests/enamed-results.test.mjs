import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const data = JSON.parse(fs.readFileSync("app/enamed-results.json"));

test("the latest course release preserves nonnumeric concept statuses and official course figures", () => {
  assert.equal(data.year, 2025);
  assert.equal(data.sources.indicators.updated, "2026-07-07");
  assert.equal(data.courses.length, 351);
  assert.equal(new Set(data.courses.map((course) => course.id)).size, 351);
  assert.deepEqual(data.national.concepts, [22, 83, 80, 114, 49]);
  assert.equal(data.national.withConcept, 348);
  assert.equal(Object.keys(data.states).length, 27);

  const byId = Object.fromEntries(
    data.courses.map((course) => [course.id, course]),
  );
  for (const code of ["49060", "1193275", "5001406"]) {
    assert.equal(byId[code].concept, null);
    assert.equal(byId[code].scores, null);
    assert.equal(byId[code].recommendation, null);
  }
  assert.equal(byId["49060"].status, "suspended");
  assert.equal(byId["1193275"].status, "suspended");
  assert.equal(byId["5001406"].status, "without_concept");
  assert.equal(byId["1439"].percentage, 90.3);
  assert.equal(byId["1439"].concept, 5);
  assert.equal(byId["1439"].participants, 124);
});

test("published course, state and Brazil aggregates reconcile and retain only group data", () => {
  const rows = data.courses.filter((course) => course.status === "published");
  const sum = (values) => values.reduce((a, b) => a + b, 0);
  assert.equal(
    sum(rows.map((course) => course.participants)),
    data.national.participants,
  );
  assert.equal(sum(rows.map((course) => course.above)), data.national.above);
  assert.equal(
    sum(Object.values(data.states).map((state) => state.courses)),
    data.courses.length,
  );
  for (const scores of [...rows, ...Object.values(data.states), data.national]
    .map((record) => record.scores)
    .concat(data.otherParticipants)) {
    assert.ok(scores.count >= 10);
    assert.equal(sum(scores.bands), scores.count);
    assert.ok(scores.average >= 0 && scores.average <= 100);
    assert.deepEqual(Object.keys(scores).sort(), ["average", "bands", "count"]);
  }
  for (const course of rows)
    assert.ok(
      course.recommendation.nps >= -100 && course.recommendation.nps <= 100,
    );
});

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("official institution snapshot has consistent states, cities and school references without addresses", () => {
  const data = JSON.parse(fs.readFileSync("app/institutions.json"));
  assert.equal(data.referenceYear, 2024);
  assert.equal(data.states.length, 27);
  assert.equal(Object.keys(data.institutions).length, 2561);
  assert.equal(
    fs.readFileSync("app/institutions.json", "utf8"),
    fs.readFileSync("assets/data/institutions.json", "utf8"),
  );
  const ids = new Set();
  for (const state of data.states) {
    assert.match(state.id, /^[A-Z]{2}$/);
    for (const city of state.cities) {
      assert.match(city.id, /^\d{7}$/);
      assert.ok(!ids.has(city.id));
      ids.add(city.id);
      assert.ok(city.institutions.length);
      for (const id of city.institutions) assert.ok(data.institutions[id]);
    }
  }
  assert.equal(ids.size, 1125);
  for (const school of Object.values(data.institutions)) {
    assert.deepEqual(Object.keys(school).sort(), ["acronym", "id", "name"]);
    assert.ok(school.name.length <= 255);
  }
});

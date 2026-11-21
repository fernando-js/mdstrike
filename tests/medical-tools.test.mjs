import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculators,
  calculateMedicalValue,
} from "../assets/js/medical-tools.js";

const evaluate = (id, fields) => {
  const calculator = calculators.find((item) => item.id === id);
  assert.ok(calculator, id);
  return calculateMedicalValue(calculator, fields);
};

test("the new medical formulas match worked examples and use the documented units", () => {
  const examples = [
    ["pressao-pulso", { systolic: 120, diastolic: 78 }, 42],
    ["indice-choque", { heartRate: 90, systolic: 120 }, 0.75],
    ["qtc-fridericia", { qt: 400, rr: 512 }, 500],
    ["pao2-fio2", { pao2: 80, fio2: 40 }, 200],
    ["anion-gap", { sodium: 140, chloride: 104, bicarbonate: 24 }, 12],
    ["anion-gap", { sodium: 135, chloride: 115, bicarbonate: 23 }, -3],
    ["sodio-hiperglicemia", { sodium: 130, glucose: 400 }, 134.8],
    [
      "osmolalidade",
      { sodium: 140, glucose: 90, lab: "bun", ureaOrBun: 28 },
      295,
    ],
    [
      "osmolalidade",
      { sodium: 140, glucose: 90, lab: "urea", ureaOrBun: "59,92" },
      295,
    ],
    [
      "fena",
      { sodium: 140, creatinine: "2,1", urineSodium: 50, urineCreatinine: 100 },
      0.75,
    ],
    ["ckd-epi-2021", { age: 55, sex: "female", creatinine: "0,7" }, 102.0736],
    ["ckd-epi-2021", { age: 60, sex: "male", creatinine: "1,8" }, 42.55905],
  ];
  for (const [id, fields, expected] of examples) {
    const result = evaluate(id, fields);
    assert.equal(result.error, undefined, id);
    assert.ok(
      Math.abs(result.value - expected) < 0.001,
      `${id}: ${result.value}`,
    );
  }
});

test("unit selectors, age, and denominators reject unsupported inputs", () => {
  assert.equal(evaluate("pao2-fio2", { pao2: 80, fio2: "0,4" }).field, "fio2");
  assert.equal(evaluate("qtc-fridericia", { qt: 400, rr: 0 }).field, "rr");
  assert.equal(
    evaluate("ckd-epi-2021", { age: 17, sex: "male", creatinine: 1 }).field,
    "age",
  );
  assert.equal(
    evaluate("ckd-epi-2021", { age: "55,5", sex: "male", creatinine: 1 }).field,
    "age",
  );
  assert.equal(
    evaluate("ckd-epi-2021", { age: 55, sex: "", creatinine: 1 }).field,
    "sex",
  );
  assert.equal(
    evaluate("osmolalidade", {
      sodium: 140,
      glucose: 90,
      lab: "",
      ureaOrBun: 28,
    }).field,
    "lab",
  );
  assert.equal(
    evaluate("fena", {
      sodium: 140,
      creatinine: 1,
      urineSodium: 30,
      urineCreatinine: 0,
    }).field,
    "urineCreatinine",
  );
});

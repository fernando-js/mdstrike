import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

test("release excludes nested runtime data and environment files", () => {
  const folder = "api/.runtime",
    environment = "api/.env.package-test";
  assert.equal(
    fs.existsSync(folder),
    false,
    "Refuse to replace an existing local runtime directory",
  );
  fs.mkdirSync(folder);
  fs.writeFileSync(`${folder}/fixture.sqlite`, "Disposable test fixture");
  fs.writeFileSync(environment, "Disposable non-secret fixture");
  try {
    execFileSync("node", ["scripts/package.mjs"]);
    const files = execFileSync(
      "unzip",
      ["-Z1", "release/mdstrike-hostinger.zip"],
      { encoding: "utf8" },
    ).split("\n");
    assert.ok(
      !files.some(
        (f) =>
          f.includes("/.runtime/") ||
          f.endsWith(".sqlite") ||
          f.endsWith("/.env.package-test"),
      ),
    );
    assert.ok(files.includes("public_html/api/index.php"));
    assert.ok(files.includes("public_html/assets/pdfjs/pdf.worker.min.mjs"));
  } finally {
    fs.rmSync(folder, { recursive: true });
    fs.rmSync(environment, { force: true });
  }
});

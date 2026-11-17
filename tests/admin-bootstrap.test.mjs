import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

function scenario(code) {
  const directory = mkdtempSync(join(tmpdir(), "mdstrike-admin-"));
  try {
    return JSON.parse(
      execFileSync(
        "php",
        [
          "-r",
          `require ${JSON.stringify(resolve("app/bootstrap.php"))}; $db=database(); ${code}`,
        ],
        {
          env: {
            ...process.env,
            MDSTRIKE_ENV: "development",
            MDSTRIKE_DB_DRIVER: "sqlite",
            MDSTRIKE_PRIVATE_DIR: directory,
            MDSTRIKE_TEST_ADMIN_HASH: createHash("sha256")
              .update("owner@example.test")
              .digest("hex"),
          },
          encoding: "utf8",
        },
      ),
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
const insert = `$db->exec("INSERT INTO md_users (nickname,email,password_hash,created_at,last_seen) VALUES ('owner','owner@example.test','unused',1,1),('player','player@example.test','unused',1,1)");`;

test("administrator bootstrap grants only the existing owner and runs once", () => {
  const result = scenario(`${insert}
    $db->exec("DELETE FROM md_migrations WHERE name='owner_admin_20261117'");
    migrate($db); migrate($db);
    $granted=$db->query('SELECT user_id FROM md_admins')->fetchAll(PDO::FETCH_COLUMN);
    $logged=$db->query("SELECT COUNT(*) FROM md_audit_logs WHERE event='admin.granted'")->fetchColumn();
    $db->exec('DELETE FROM md_admins'); migrate($db);
    echo json_encode(['granted'=>$granted,'logged'=>(int)$logged,'afterRevocation'=>(int)$db->query('SELECT COUNT(*) FROM md_admins')->fetchColumn()]);`);
  assert.deepEqual(result, { granted: [1], logged: 1, afterRevocation: 0 });
});

test("registering the owner email after deployment never grants administrator access", () => {
  assert.equal(
    scenario(
      `${insert} migrate($db); echo json_encode((int)$db->query('SELECT COUNT(*) FROM md_admins')->fetchColumn());`,
    ),
    0,
  );
});

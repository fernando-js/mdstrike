import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

test("the synthetic seed is idempotent and preserves a player's account and activity", () => {
  const directory = mkdtempSync(join(tmpdir(), "mdstrike-synthetic-"));
  try {
    const result = JSON.parse(
      execFileSync(
        "php",
        [
          "-r",
          `
      require 'app/bootstrap.php';
      require 'app/admin.php';
      $db = database();
      query("INSERT INTO md_users (nickname,email,password_hash,created_at,last_seen) VALUES ('AtlasAster','real@example.test','test-hash',1,1)");
      seed_synthetic_rankings($db);
      seed_synthetic_rankings($db);
      $admin = admin_dispatch('admin-users', ['type' => 'synthetic', 'size' => 100], ['id' => 1]);
      $summary = admin_dispatch('admin-overview', [], ['id' => 1])['summary'];
      echo json_encode([
        'users' => $summary['users'],
        'synthetic' => $summary['syntheticUsers'],
        'adminTotal' => $admin['total'],
        'adminMarked' => count(array_filter($admin['rows'], fn($row) => $row['synthetic'])),
        'realMatches' => $summary['matches'],
        'realNickname' => query('SELECT nickname FROM md_users WHERE id = 1')->fetchColumn(),
        'withoutPasswords' => (int)query("SELECT COUNT(*) FROM md_users JOIN md_synthetic_users ON user_id = id WHERE password_hash = ''")->fetchColumn(),
        'teaPlayers' => (int)query("SELECT COUNT(DISTINCT user_id) FROM md_matches m WHERE map_id = 'tea' AND " . completed_match_filter())->fetchColumn(),
        'aggregatesAgree' => (int)query('SELECT COUNT(*) FROM md_users u JOIN md_synthetic_users s ON s.user_id = u.id WHERE u.points = (SELECT SUM(m.score) FROM md_matches m WHERE m.user_id = u.id) AND u.played = (SELECT COUNT(*) FROM md_matches m WHERE m.user_id = u.id)')->fetchColumn(),
      ]);
    `,
        ],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            MDSTRIKE_ENV: "development",
            MDSTRIKE_DB_DRIVER: "sqlite",
            MDSTRIKE_PRIVATE_DIR: directory,
            MDSTRIKE_SEED_SYNTHETIC_RANKINGS: "0",
          },
        },
      ),
    );
    assert.equal(result.users, 1);
    assert.equal(result.synthetic, 120);
    assert.equal(result.adminTotal, 120);
    assert.equal(result.adminMarked, 100);
    assert.equal(result.realMatches, 0);
    assert.equal(result.realNickname, "AtlasAster");
    assert.equal(result.withoutPasswords, 120);
    assert.ok(result.teaPlayers >= 24);
    assert.equal(result.aggregatesAgree, 120);
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
});

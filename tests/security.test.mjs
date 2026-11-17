import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";

function php(code) {
  const directory = mkdtempSync(join(tmpdir(), "mdstrike-security-"));
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
          },
          encoding: "utf8",
        },
      ),
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("ranking eligibility excludes semantic forfeits and incomplete JSON, preserves legitimate losses", () => {
  const rows = [
    ["aborted", '{"aborted":true}'],
    ["spaced", '{ "answered": 1, "win": true, "aborted": true, "extra": 42 }'],
    ["invalid", "{broken"],
    ["null", null],
    ["array", "[]"],
    ["incomplete", '{"answered":1}'],
    ["zero", '{"answered":0,"win":false}'],
    ["win", '{"answered":10,"win":true}'],
    ["loss", '{"answered":7,"win":false}'],
    ["false-abort", '{"answered":5,"win":false,"aborted":false}'],
  ];
  const result = php(
    `$rows=json_decode(${JSON.stringify(JSON.stringify(rows))},true); foreach($rows as [$id,$json]) query('INSERT INTO md_matches (id,user_id,mode,map_id,questions_json,started_at,issued_at,finished_at,result_json) VALUES (?,1,?,?,?,1,1,2,?)',[$id,'practice','all','{}',$json]); echo json_encode(query('SELECT m.id FROM md_matches m WHERE '.completed_match_filter().' ORDER BY m.id')->fetchAll(PDO::FETCH_COLUMN));`,
  );
  assert.deepEqual(result, ["false-abort", "loss", "win"]);
});

test("limits are shared by principal, roll over, cap counters, and ignore forwarded IP", () => {
  const result = php(
    `$_SERVER['REMOTE_ADDR']='127.0.0.1'; $first=consume_limit('test',2,60); $_SERVER['HTTP_X_FORWARDED_FOR']='203.0.113.5'; $second=consume_limit('test',2,60); $blocked=consume_limit('test',2,60); for($i=0;$i<10;$i++)consume_limit('test',2,60); $cap=(int)query('SELECT attempts FROM md_auth_limits WHERE bucket=?',[limit_key('test')])->fetchColumn(); query('UPDATE md_auth_limits SET window_start=? WHERE bucket=?',[time()-61,limit_key('test')]); $reset=consume_limit('test',2,60); $_SERVER['REMOTE_ADDR']='192.0.2.1';consume_limit('account',1,60,'user:7');$_SERVER['REMOTE_ADDR']='192.0.2.2';$distributed=consume_limit('account',1,60,'user:7');echo json_encode([$first,$second,$blocked>0,$cap,$reset,$distributed>0]);`,
  );
  assert.deepEqual(result, [0, 0, true, 3, 0, true]);
});

test("noisy audit events are capped while sensitive account events remain recorded", () => {
  const result = php(
    `$_SERVER['REMOTE_ADDR']='127.0.0.1';for($i=0;$i<12;$i++){audit_event('api.error');audit_event('admin.denied',1);audit_event('auth.password_changed',1,1);}echo json_encode(query('SELECT event,COUNT(*) AS total FROM md_audit_logs GROUP BY event ORDER BY event')->fetchAll());`,
  );
  assert.deepEqual(result, [
    { event: "admin.denied", total: 5 },
    { event: "api.error", total: 5 },
    { event: "auth.password_changed", total: 12 },
  ]);
});

test("maintenance preserves recent activity and live rate limits, deletes only expired batches", () => {
  const result = php(
    `for($i=0;$i<1002;$i++)query('INSERT INTO md_audit_logs(event,metadata_json,request_id,created_at) VALUES (?,?,?,?)',['old','{}','test',time()-91*86400]); audit_event('recent');query('INSERT INTO md_auth_limits(bucket,attempts,window_start) VALUES (?,1,?)',['old',time()-3*86400]);consume_limit('live',2,900);security_maintenance();$old=(int)query('SELECT COUNT(*) FROM md_audit_logs WHERE event=?',['old'])->fetchColumn();$recent=(int)query('SELECT COUNT(*) FROM md_audit_logs WHERE event=?',['recent'])->fetchColumn();security_maintenance();echo json_encode([$old,$recent,(int)query('SELECT COUNT(*) FROM md_audit_logs WHERE event=?',['old'])->fetchColumn(),query('SELECT bucket FROM md_auth_limits WHERE bucket=?',['old'])->fetchColumn()===false,query('SELECT bucket FROM md_auth_limits WHERE bucket=?',[limit_key('live')])->fetchColumn()!==false]);`,
  );
  assert.deepEqual(result, [2, 1, 2, true, true]);
});

test("idle and absolute expiry revoke normal/admin sessions while legacy active sessions survive", () => {
  const result = php(
    `session_save_path(private_directory());start_session();query('INSERT INTO md_users(nickname,email,password_hash,created_at,last_seen) VALUES (?,?,?,?,?)',['test','test@example.test','hash',time(),time()]);$user=query('SELECT * FROM md_users')->fetch();$id=(int)$user['id'];$fingerprint=hash('sha256',$user['password_hash']);$check=function($auth,$last,$admin=false)use($id,$fingerprint){query('DELETE FROM md_admins');if($admin)query('INSERT INTO md_admins(user_id,granted_at) VALUES (?,?)',[$id,time()]);$_SESSION=['user_id'=>$id,'password_fingerprint'=>$fingerprint,'authenticated_at'=>$auth,'csrf'=>'test'];if($last!==null)$_SESSION['last_activity']=$last;return current_user()!==null;};$now=time();echo json_encode([$check($now-10,$now-10),$check($now-10,null),$check($now-86401,$now),$check($now-10,$now-7201),$check($now-10,$now-1801,true),$check($now-28801,$now,true),$check($now-10,$now-10,true)]);`,
  );
  assert.deepEqual(result, [true, true, false, false, false, false, true]);
});

test("concurrent first requests share the same atomic limit", async () => {
  const directory = mkdtempSync(join(tmpdir(), "mdstrike-parallel-"));
  const env = {
    ...process.env,
    MDSTRIKE_ENV: "development",
    MDSTRIKE_DB_DRIVER: "sqlite",
    MDSTRIKE_PRIVATE_DIR: directory,
  };
  const setup = `require ${JSON.stringify(resolve("app/bootstrap.php"))}; database();`;
  try {
    execFileSync("php", ["-r", setup], { env });
    const runs = await Promise.all(
      Array.from({ length: 12 }, () =>
        promisify(execFile)(
          "php",
          ["-r", setup + "echo json_encode(consume_limit('parallel',4,60));"],
          { env },
        ),
      ),
    );
    assert.equal(runs.filter((r) => JSON.parse(r.stdout) === 0).length, 4);
    assert.equal(runs.filter((r) => JSON.parse(r.stdout) > 0).length, 8);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("public catalog and guest session survive absent database configuration", () => {
  const directory = mkdtempSync(join(tmpdir(), "mdstrike-guest-"));
  try {
    const env = {
      ...process.env,
      MDSTRIKE_ENV: "production",
      MDSTRIKE_PRIVATE_DIR: directory,
      DB_PASSWORD: "",
      MDSTRIKE_DB_DRIVER: "mysql",
    };
    const api = JSON.stringify(resolve("api/index.php"));
    const session = JSON.parse(
      execFileSync(
        "php",
        [
          "-r",
          `session_save_path(${JSON.stringify(directory)});$_SERVER['REQUEST_METHOD']='GET';$_GET['action']='session';require ${api};`,
        ],
        { env, encoding: "utf8" },
      ),
    );
    assert.equal(session.configured, false);
    assert.equal(session.user, null);
    const catalog = JSON.parse(
      execFileSync(
        "php",
        [
          "-r",
          `session_save_path(${JSON.stringify(directory)});$_SERVER['REQUEST_METHOD']='GET';$_GET['action']='catalog';require ${api};`,
        ],
        {
          env: { ...env, DB_PASSWORD: "unreachable-test-only" },
          encoding: "utf8",
        },
      ),
    );
    assert.equal(catalog.specialties.length, 55);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

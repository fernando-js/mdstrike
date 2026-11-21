import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const output = path.resolve("release");
fs.mkdirSync(output, { recursive: true });
const site = path.join(output, "public_html");
fs.rmSync(site, { recursive: true, force: true });
fs.mkdirSync(site, { recursive: true });
const blocked = new Set([
  ".runtime",
  ".git",
  "node_modules",
  "backups",
  "config.local.php",
]);
for (const entry of [
  "index.html",
  "exam.php",
  "robots.txt",
  "indexnow.txt",
  ".htaccess",
  "favicon.ico",
  "assets",
  "api",
  "app",
])
  fs.cpSync(entry, path.join(site, entry), {
    recursive: true,
    filter: (source) =>
      !blocked.has(path.basename(source)) &&
      !path.basename(source).startsWith(".env") &&
      !/\.(?:sqlite|db)(?:-.*)?$/i.test(source),
  });
// The PHP config example contains no password, but is unnecessary in public_html.
fs.rmSync(path.join(site, "app/config.example.php"));
const privateDir = path.join(output, ".mdstrike");
fs.mkdirSync(privateDir, { recursive: true });
fs.copyFileSync(".env.example", path.join(privateDir, ".env.example"));
fs.copyFileSync("README.md", path.join(output, "LEIA-ME.md"));
const archive = path.join(output, "mdstrike-hostinger.zip");
if (fs.existsSync(archive)) fs.unlinkSync(archive);
execFileSync(
  "zip",
  ["-qr", archive, "public_html", ".mdstrike", "LEIA-ME.md"],
  { cwd: output },
);
console.log(`Hostinger package: ${archive}`);
console.log(
  "No credentials, local databases, test accounts, node_modules or legacy pages included.",
);

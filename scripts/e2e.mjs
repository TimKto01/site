import "dotenv/config";
import { Client } from "pg";
import { randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
if (!process.env.DATABASE_URL)
  throw new Error("DATABASE_URL is required for isolated browser tests");
const admin = new Client({ connectionString: process.env.DATABASE_URL });
const database = `greenstore_e2e_${randomBytes(8).toString("hex")}`;
const url = new URL(process.env.DATABASE_URL);
url.pathname = `/${database}`;
const uploadDir = await mkdtemp(path.join(tmpdir(), "greenstore-e2e-"));
const env = {
  ...process.env,
  DATABASE_URL: url.toString(),
  UPLOAD_DIR: uploadDir,
  ADMIN_USERNAME: "e2e_admin",
  ADMIN_PASSWORD: randomBytes(24).toString("base64url"),
  APP_URL: "http://127.0.0.1:3100",
  E2E_ISOLATED: "1",
};
const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} exited with status ${code}`)),
    );
  });
let created = false;
try {
  await admin.connect();
  await admin.query(`CREATE DATABASE "${database}"`);
  created = true;
  await run("npm", ["run", "db:deploy"]);
  await run("npm", ["run", "db:seed"]);
  await run("npm", ["run", "db:seed"]);
  await run("npm", ["run", "admin:create"]);
  await run(process.execPath, [
    "node_modules/@playwright/test/cli.js",
    "test",
    ...process.argv.slice(2),
  ]);
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Browser tests failed",
  );
  process.exitCode = 1;
} finally {
  if (created) await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
  await admin.end();
  await rm(uploadDir, { recursive: true, force: true });
}

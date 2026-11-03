import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { getDb } from "../src/server/client";
import { hashPassword } from "../src/server/password";
const username = (process.env.ADMIN_USERNAME ?? "admin").toLowerCase();
if (!/^[a-z0-9_.-]{1,80}$/.test(username))
  throw new Error("Invalid ADMIN_USERNAME");
const db = getDb();
try {
  if (await db.adminUser.findUnique({ where: { username } })) {
    console.log("Admin already exists; existing password was not changed.");
  } else {
    const generated = !process.env.ADMIN_PASSWORD;
    const password =
      process.env.ADMIN_PASSWORD ?? randomBytes(24).toString("base64url");
    // Write a generated local bootstrap credential before touching the DB. Never overwrite it.
    if (generated) {
      await mkdir("storage", { recursive: true, mode: 0o700 });
      await writeFile(
        "storage/admin-bootstrap.txt",
        `Local admin login\nUsername: ${username}\nPassword: ${password}\n`,
        { mode: 0o600, flag: "wx" },
      );
    }
    await db.adminUser.create({
      data: { username, passwordHash: await hashPassword(password) },
    });
    console.log(
      generated
        ? "Admin created. Credentials are in ignored storage/admin-bootstrap.txt (mode 0600)."
        : "Admin created with configured credentials.",
    );
  }
} finally {
  await db.$disconnect();
}

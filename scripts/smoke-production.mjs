import "dotenv/config";
import assert from "node:assert/strict";
import { Client } from "pg";
import { chromium } from "playwright";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import sharp from "sharp";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const admin = new Client({ connectionString: process.env.DATABASE_URL });
const database = `greenstore_smoke_${randomBytes(8).toString("hex")}`;
const url = new URL(process.env.DATABASE_URL);
url.pathname = `/${database}`;
const temporary = await mkdtemp(path.join(tmpdir(), "greenstore-smoke-"));
const listener = net.createServer();
await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
const port = listener.address().port;
await new Promise((resolve) => listener.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const env = {
  ...process.env,
  DATABASE_URL: url.toString(),
  UPLOAD_DIR: temporary,
  ADMIN_USERNAME: "smoke_admin",
  ADMIN_PASSWORD: randomBytes(24).toString("base64url"),
  APP_URL: origin,
};
const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} failed: ${code}`)),
    );
  });
let server;
let browser;
let created = false;
async function start() {
  server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    { env, stdio: "inherit", detached: true },
  );
  for (let attempt = 0; attempt < 150; attempt++) {
    if (server.exitCode !== null)
      throw new Error("Production server exited before readiness");
    try {
      if ((await fetch(origin + "/admin/login")).status === 200) return;
    } catch {
      /* Server is still starting. */
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("Production server readiness timeout");
}
async function stop() {
  if (!server || server.exitCode !== null) return;
  const child = server;
  const exited = new Promise((resolve) => child.once("exit", resolve));
  process.kill(-child.pid, "SIGTERM");
  await exited;
  server = undefined;
}
try {
  await admin.connect();
  await admin.query(`CREATE DATABASE "${database}"`);
  created = true;
  await run("npm", ["run", "db:deploy"]);
  await run("npm", ["run", "db:seed"]);
  await run("npm", ["run", "admin:create"]);
  const db = new Client({ connectionString: env.DATABASE_URL });
  await db.connect();
  let categoryId;
  try {
    categoryId = (
      await db.query('SELECT id FROM "Category" ORDER BY slug LIMIT 1')
    ).rows[0].id;
  } finally {
    await db.end();
  }
  await start();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin + "/admin/login");
  await page.getByLabel("Логин", { exact: true }).fill(env.ADMIN_USERNAME);
  await page.getByLabel("Пароль", { exact: true }).fill(env.ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await page.getByRole("heading", { name: "Обзор магазина" }).waitFor();
  const cookie = (await context.cookies()).find((c) => c.name === "gs_admin");
  assert.ok(cookie?.httpOnly);
  assert.equal(cookie.sameSite, "Lax");
  const photo = await sharp({
    create: { width: 80, height: 100, channels: 3, background: "#365b40" },
  })
    .png()
    .toBuffer();
  const uploaded = await page.request.post(origin + "/api/admin/uploads", {
    headers: { Origin: origin },
    multipart: {
      file: { name: "persistence.png", mimeType: "image/png", buffer: photo },
    },
  });
  assert.equal(uploaded.status(), 201);
  const { url: mediaUrl } = await uploaded.json();
  const data = {
    name: "Проверка сохранения",
    slug: "persistence-test",
    sku: "SMOKE-PERSIST",
    categoryId,
    latin: "",
    description:
      "Проверка хранения товара и изображения после полного перезапуска приложения.",
    shortDescription: "",
    status: "PUBLISHED",
    isDemo: true,
    isNew: false,
    shippingAllowed: false,
    shippingNote: "",
    images: [{ url: mediaUrl, alt: "Тестовое изображение" }],
    attributes: [],
    variants: [
      {
        label: "20–30 см",
        priceRubles: "999.25",
        stock: 5,
        container: "C2",
        weightGrams: 1000,
        lengthMm: 200,
        widthMm: 200,
        heightMm: 400,
      },
    ],
  };
  const saved = await page.request.post(origin + "/api/admin/products", {
    headers: { Origin: origin },
    data,
  });
  assert.equal(saved.status(), 201);
  const { id } = await saved.json();
  await stop();
  await start();
  await page.goto(origin + `/admin/products/${id}`);
  await page.getByRole("heading", { name: "Редактировать растение" }).waitFor();
  assert.equal(
    await page.getByLabel("Название товара", { exact: true }).inputValue(),
    data.name,
  );
  assert.equal(
    await page.getByLabel("Цена 1, ₽", { exact: true }).inputValue(),
    "999.25",
  );
  assert.equal(
    await page.getByLabel("Остаток 1, шт.", { exact: true }).inputValue(),
    "5",
  );
  assert.equal(
    (await page.request.get(origin + mediaUrl)).headers()["content-type"],
    "image/webp",
  );
  await page.goto(origin + "/catalog/persistence-test");
  assert.match(await page.getByTestId("variant-price").textContent(), /999,25/);
  await page
    .getByRole("button", { name: "Добавить в корзину", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Открыть корзину", exact: true })
    .click();
  await page.getByTestId("cart-item").waitFor();
  assert.match(await page.getByTestId("cart-total").textContent(), /999,25/);
  for (const route of ["/catalog/no-such-plant", "/missing-page"])
    assert.equal((await page.request.get(origin + route)).status(), 404);
  assert.deepEqual(errors, []);
  console.log(
    "PASS production: login, upload, product creation, full app restart, session/product/price/stock/image persistence, live cart, 404, no pageerror.",
  );
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Production smoke failed",
  );
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await stop();
  if (created) await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
  await admin.end();
  await rm(temporary, { recursive: true, force: true });
}

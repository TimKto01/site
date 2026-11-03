import {
  expect,
  test,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import { Client } from "pg";
import { randomUUID, createHash } from "node:crypto";
import sharp from "sharp";
const origin = "http://127.0.0.1:3100";
const username = process.env.ADMIN_USERNAME!;
const password = process.env.ADMIN_PASSWORD!;
test.describe.configure({ mode: "serial" });
async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Логин", { exact: true }).fill(username);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Обзор магазина" }),
  ).toBeVisible();
}
async function mutation(
  request: APIRequestContext,
  path: string,
  method: string,
  data?: unknown,
) {
  return request.fetch(path, { method, data, headers: { Origin: origin } });
}
async function saveProductUI(page: Page) {
  const response = page.waitForResponse(
    (r) =>
      r.url().includes("/api/admin/products") &&
      ["PUT", "POST"].includes(r.request().method()),
  );
  await page
    .getByRole("button", { name: "Сохранить товар", exact: true })
    .click();
  const saved = await response;
  expect(saved.ok()).toBe(true);
  await expect(page).toHaveURL(/\/admin\/products\/(?!new)[^/?]+\?saved=1/);
  await page.reload();
  await expect(
    page.getByRole("status").filter({ hasText: "Товар сохранён" }),
  ).toBeVisible();
  return saved.request().postDataJSON() as Record<string, unknown>;
}
test("pages and every mutation reject unauthenticated access", async ({
  page,
  request,
}) => {
  for (const path of [
    "/admin",
    "/admin/products",
    "/admin/products/new",
    "/admin/products/unknown",
    "/admin/categories",
    "/admin/settings",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/login/);
  }
  for (const [path, method] of [
    ["/api/admin/products", "POST"],
    ["/api/admin/products/id", "PUT"],
    ["/api/admin/products/id", "DELETE"],
    ["/api/admin/categories", "POST"],
    ["/api/admin/categories/id", "PUT"],
    ["/api/admin/categories/id", "DELETE"],
    ["/api/admin/settings", "PUT"],
    ["/api/admin/uploads", "POST"],
    ["/api/admin/logout", "POST"],
  ])
    expect((await mutation(request, path!, method!, {})).status(), path).toBe(
      401,
    );
  const denied = await request.post("/api/admin/login", {
    data: { username, password },
    headers: { Origin: "https://other.example" },
  });
  expect(denied.status()).toBe(403);
});
test("admin can create a category, upload a photo, publish and edit variants, hide and archive", async ({
  page,
}) => {
  test.setTimeout(90000);
  await login(page);
  const suffix = randomUUID().slice(0, 8);
  const name = `Тестовое растение ${suffix}`;
  const slug = `test-plant-${suffix}`;
  await page.goto("/admin/categories");
  const categoryForm = page.getByTestId("category-form").first();
  await categoryForm
    .getByLabel("Название категории", { exact: true })
    .fill(`Тестовая коллекция ${suffix}`);
  await categoryForm
    .getByLabel("Адрес категории", { exact: true })
    .fill(`test-${suffix}`);
  await categoryForm.getByRole("button", { name: "Создать категорию" }).click();
  await expect(
    page.getByRole("heading", {
      name: `Тестовая коллекция ${suffix}`,
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/admin/products/new");
  await page.getByLabel("Название товара", { exact: true }).fill(name);
  await page.getByLabel("Адрес товара (латиницей)").fill(slug);
  await page.getByLabel("Артикул", { exact: true }).fill(`E2E-${suffix}`);
  await page
    .getByLabel("Категория", { exact: true })
    .selectOption({ label: `Тестовая коллекция ${suffix}` });
  await page
    .getByLabel("Описание", { exact: true })
    .fill("Тестовое растение для проверки полного редактирования каталога.");
  await page.getByLabel("Размер 1", { exact: true }).fill("20–30 см");
  await page.getByLabel("Цена 1, ₽", { exact: true }).fill("1234,56");
  await page.getByLabel("Остаток 1, шт.", { exact: true }).fill("7");
  const photo = await sharp({
    create: { width: 48, height: 64, channels: 3, background: "#458052" },
  })
    .png()
    .toBuffer();
  await page
    .getByLabel("Загрузить фотографию", { exact: false })
    .setInputFiles({ name: "plant.png", mimeType: "image/png", buffer: photo });
  await expect(
    page.getByRole("link", { name: "Обложка", exact: true }),
  ).toBeVisible();
  await saveProductUI(page);
  await expect(
    page.getByRole("status").filter({ hasText: "Товар сохранён" }),
  ).toBeVisible();
  const editUrl = page.url();
  const id = /\/admin\/products\/([^?]+)/.exec(editUrl)![1]!;
  expect((await page.request.get(`/catalog/${slug}`)).status()).toBe(404); // Draft is never public.
  await page.getByLabel("Статус публикации").selectOption("PUBLISHED");
  await page
    .getByRole("button", { name: "Добавить вариант", exact: true })
    .click();
  await page.getByLabel("Размер 2", { exact: true }).fill("Большой");
  await page.getByLabel("Цена 2, ₽", { exact: true }).fill("2400.10");
  await page.getByLabel("Остаток 2, шт.", { exact: true }).fill("2");
  await saveProductUI(page);
  await expect(
    page.getByRole("status").filter({ hasText: "Товар сохранён" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Цена 1, ₽", { exact: true })).toHaveValue(
    "1234.56",
  );
  await page.goto(`/catalog/${slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await page.getByLabel("Большой", { exact: true }).check();
  await expect(page.getByTestId("variant-price")).toContainText("2 400");
  const imageSrc = await page.locator(".detail-art img").getAttribute("src");
  const parsedImage = new URL(imageSrc!, origin);
  const imageUrl =
    parsedImage.pathname === "/_next/image"
      ? parsedImage.searchParams.get("url")
      : parsedImage.pathname;
  expect(imageUrl).toContain("/media/");
  const image = await page.request.get(imageUrl!);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/webp");
  await page.goto(`/admin/products/${id}`);
  await page.getByLabel("Цена 1, ₽", { exact: true }).fill("990.25");
  await page.getByLabel("Остаток 1, шт.", { exact: true }).fill("1");
  const stale = await saveProductUI(page);
  expect(
    (
      await mutation(page.request, `/api/admin/products/${id}`, "PUT", stale)
    ).status(),
  ).toBe(409);
  await expect(
    page.getByRole("status").filter({ hasText: "Товар сохранён" }),
  ).toBeVisible();
  await page.goto(`/catalog/${slug}`);
  await expect(page.getByTestId("variant-price")).toContainText("990");
  await expect(
    page.getByText("Тестовый остаток: 1 шт.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Добавить в корзину", exact: true })
    .click();
  await page.goto(`/admin/products/${id}`);
  await page.getByLabel("Статус публикации").selectOption("DRAFT");
  await saveProductUI(page);
  await expect(
    page.getByRole("status").filter({ hasText: "Товар сохранён" }),
  ).toBeVisible();
  expect((await page.request.get(`/catalog/${slug}`)).status()).toBe(404);
  await page.goto("/cart");
  await expect(
    page.getByText("Этот вариант больше недоступен.", { exact: false }),
  ).toBeVisible();
  await page.goto(`/admin/products/${id}`);
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Архивировать товар", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  await page.goto("/admin/categories");
  const row = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: `Тестовая коллекция ${suffix}`,
      exact: true,
    }),
  });
  page.once("dialog", (dialog) => dialog.accept());
  await row
    .getByRole("button", { name: "Удалить категорию", exact: true })
    .click();
  await expect(row.getByRole("alert")).toContainText("В категории есть товары");
  // Check journal and database constraints without exposing credentials.
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    const movement = await db.query(
      'SELECT count(*)::integer AS count FROM "InventoryMovement" m JOIN "ProductVariant" v ON v.id=m."variantId" WHERE v."productId"=$1',
      [id],
    );
    expect(movement.rows[0].count).toBeGreaterThanOrEqual(3);
    await expect(
      db.query('UPDATE "ProductVariant" SET stock=-1 WHERE "productId"=$1', [
        id,
      ]),
    ).rejects.toMatchObject({ code: "23514" });
  } finally {
    await db.end();
  }
});
test("settings appear on the storefront and contact page", async ({ page }) => {
  await login(page);
  await page.goto("/admin/settings");
  await page
    .getByLabel("Название магазина", { exact: true })
    .fill("GreenStore Тест");
  await page
    .getByLabel("Заголовок главной", { exact: true })
    .fill("Больше жизни\nв тестовом саду.");
  await page
    .getByLabel("Телефон", { exact: true })
    .fill("Тестовый контакт, не звонить");
  await page
    .getByRole("button", { name: "Сохранить настройки", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Настройки сохранены" }),
  ).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "в тестовом саду.",
  );
  await expect(page).toHaveTitle(/GreenStore Тест/);
  await page.goto("/contacts");
  await expect(
    page.getByText("Тестовый контакт, не звонить", { exact: true }),
  ).toBeVisible();
});
test("CSRF, image validation, invalid input, cookie flags and logout are enforced", async ({
  page,
}) => {
  await login(page);
  const cookies = await page.context().cookies();
  const session = cookies.find((c) => c.name === "gs_admin")!;
  expect(session.httpOnly).toBe(true);
  expect(session.sameSite).toBe("Lax");
  expect(
    (
      await page.request.put("/api/admin/settings", {
        data: {},
        headers: { Origin: "https://other.example" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await page.request.post("/api/admin/products", {
        data: {},
        headers: { Origin: origin },
      })
    ).status(),
  ).toBe(422);
  for (const upload of [
    {
      name: "bad.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      ),
    },
    {
      name: "fake.png",
      mimeType: "image/png",
      buffer: Buffer.from("not an image"),
    },
    {
      name: "big.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(6 * 1024 * 1024),
    },
  ]) {
    const response = await page.request.post("/api/admin/uploads", {
      headers: { Origin: origin },
      multipart: { file: upload },
    });
    expect([413, 415, 422]).toContain(response.status());
  }
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    const hash = createHash("sha256").update(session.value).digest("hex");
    const row = await db.query(
      'SELECT "tokenHash" FROM "AdminSession" WHERE "tokenHash"=$1',
      [hash],
    );
    expect(row.rowCount).toBe(1);
    expect(row.rows[0].tokenHash).not.toBe(session.value);
  } finally {
    await db.end();
  }
  const oddQuery = await page.goto(
    "/admin/products?page=1.2&q=a&q=b&status=unknown",
  );
  expect(oddQuery?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { level: 1, name: "Товары" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Выйти", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
  expect(
    (
      await page.request.post("/api/admin/products", {
        data: {},
        headers: { Origin: origin },
      })
    ).status(),
  ).toBe(401);
});
test("expired sessions and brute-force attempts are rejected", async ({
  page,
  request,
}) => {
  await login(page);
  const session = (await page.context().cookies()).find(
    (c) => c.name === "gs_admin",
  )!;
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    await db.query(
      'UPDATE "AdminSession" SET "expiresAt"=NOW()-INTERVAL \'1 minute\' WHERE "tokenHash"=$1',
      [createHash("sha256").update(session.value).digest("hex")],
    );
  } finally {
    await db.end();
  }
  await page.goto("/admin/products/new");
  await expect(page).toHaveURL(/\/admin\/login/);
  for (let i = 0; i < 9; i++) {
    const result = await request.post("/api/admin/login", {
      headers: { Origin: origin },
      data: { username: "bruteforce_probe", password: "not-a-real-password" },
    });
    expect(result.status()).toBe(i < 8 ? 401 : 429);
  }
});

test("empty categories can be renamed and deleted and changes are public", async ({
  page,
}) => {
  await login(page);
  const suffix = randomUUID().slice(0, 8);
  const input = {
    name: `Пустая ${suffix}`,
    slug: `empty-${suffix}`,
    caption: "Проверка",
    image: "/illustrations/flower.svg",
    sortOrder: 90,
  };
  const created = await mutation(
    page.request,
    "/api/admin/categories",
    "POST",
    input,
  );
  expect(created.status()).toBe(201);
  const { id } = (await created.json()) as { id: string };
  const changed = {
    ...input,
    name: `Обновлённая ${suffix}`,
    slug: `changed-${suffix}`,
  };
  expect(
    (
      await mutation(
        page.request,
        `/api/admin/categories/${id}`,
        "PUT",
        changed,
      )
    ).status(),
  ).toBe(200);
  await page.goto("/catalog");
  await expect(
    page
      .getByRole("navigation", { name: "Категории", exact: true })
      .getByRole("link", { name: changed.name, exact: true }),
  ).toBeVisible();
  expect(
    (
      await mutation(page.request, `/api/admin/categories/${id}`, "DELETE")
    ).status(),
  ).toBe(200);
  await page.reload();
  await expect(
    page
      .getByRole("navigation", { name: "Категории", exact: true })
      .getByRole("link", { name: changed.name, exact: true }),
  ).toHaveCount(0);
});

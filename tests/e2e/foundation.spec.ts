import { expect, test } from "@playwright/test";
test("home is accessible on desktop and mobile", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/GreenStore/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Больше жизни",
  );
  await expect(
    page.getByRole("link", { name: "Выбрать растения", exact: true }),
  ).toBeVisible();
  expect(await page.locator("html").getAttribute("lang")).toBe("ru");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("unknown page and product return 404", async ({ page }) => {
  for (const path of ["/does-not-exist", "/catalog/missing-plant"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "ничего не растёт",
    );
  }
});

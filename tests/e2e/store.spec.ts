import { expect, test } from "@playwright/test";
test("catalog searches, filters, sorts and paginates", async ({
  page,
  isMobile,
}) => {
  const openFilters = async () => {
    if (isMobile) {
      const toggle = page.getByRole("button", { name: "Фильтры и сортировка" });
      if ((await toggle.getAttribute("aria-expanded")) === "false")
        await toggle.click();
    }
  };
  await page.goto("/catalog");
  await expect(page.getByTestId("result-count")).toHaveText("12");
  await expect(page.locator(".catalog-grid article")).toHaveCount(8);
  await page.getByRole("link", { name: "Страница 2", exact: true }).click();
  await expect(page.locator(".catalog-grid article")).toHaveCount(4);
  await openFilters();
  await page.getByLabel("Название", { exact: true }).fill("ТУЯ");
  await page.getByLabel("Цена до").fill("600");
  await page.getByLabel("Есть демо-остаток").check();
  await page.getByRole("button", { name: "Показать", exact: true }).click();
  await expect(page.getByTestId("result-count")).toHaveText("1");
  await expect(
    page.getByRole("heading", { name: "Туя западная Файер Чиф" }),
  ).toBeVisible();
  await openFilters();
  await page.getByRole("link", { name: "Сбросить фильтры" }).click();
  await expect(page.getByTestId("result-count")).toHaveText("12");
  await openFilters();
  await expect(page.getByLabel("Название", { exact: true })).toHaveValue("");
  await page.getByLabel("Категория", { exact: true }).selectOption("spruce");
  await page.getByLabel("Сортировка").selectOption("price-desc");
  await page.getByRole("button", { name: "Показать", exact: true }).click();
  await expect(page.getByTestId("result-count")).toHaveText("2");
  await expect(page.locator(".catalog-grid h3").first()).toHaveText(
    "Ель колючая Глаука",
  );
  await openFilters();
  await page
    .getByLabel("Название", { exact: true })
    .fill("неизвестное растение");
  await page.getByRole("button", { name: "Показать", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Пока ничего не нашлось" }),
  ).toBeVisible();
});
test("variants, price, quantities and cart survive reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/catalog/thuja-smaragd");
  await expect(page.getByTestId("variant-price")).toContainText("950");
  await page.getByLabel("Увеличить количество", { exact: true }).click();
  await page.getByRole("button", { name: "Добавить в корзину" }).click();
  await expect(
    page.getByRole("status", { name: "Добавление в корзину" }),
  ).toContainText("Добавлено в корзину: 2");
  await page.getByLabel("Крупный саженец").check();
  await expect(page.getByTestId("variant-price")).toContainText("1 600");
  await page.getByRole("button", { name: "Добавить в корзину" }).click();
  await page
    .getByRole("link", { name: "Открыть корзину", exact: true })
    .click();
  await expect(page.getByTestId("cart-item")).toHaveCount(2);
  await expect(page.getByTestId("cart-total")).toContainText("3 500");
  await page.reload();
  await expect(page.getByTestId("cart-item")).toHaveCount(2);
  await expect(page.getByTestId("cart-count")).toHaveText("3");
  await page
    .getByRole("button", {
      name: "Увеличить Туя западная Смарагд, 40–60 см",
      exact: true,
    })
    .click();
  await expect(page.getByTestId("cart-total")).toContainText("4 450");
  await page
    .getByRole("button", {
      name: "Удалить Туя западная Смарагд, Крупный саженец",
      exact: true,
    })
    .click();
  await expect(page.getByTestId("cart-item")).toHaveCount(1);
  await page
    .getByRole("button", {
      name: "Удалить Туя западная Смарагд, 40–60 см",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Здесь будет ваш сад" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("unavailable variant cannot be added and stock cannot be exceeded", async ({
  page,
}) => {
  await page.goto("/catalog/thuja-fire-chief");
  await page.getByLabel("Крупный саженец").check();
  await expect(
    page.getByRole("button", { name: "Нет в наличии", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("9–15 см").check();
  for (let i = 0; i < 7; i++)
    await page
      .getByRole("button", { name: "Увеличить количество", exact: true })
      .click();
  await expect(
    page.getByRole("button", { name: "Увеличить количество", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Добавить в корзину" }).click();
  await expect(page.getByTestId("cart-count")).toHaveText("8");
  await expect(
    page.getByRole("button", { name: "Весь демо-остаток в корзине" }),
  ).toBeDisabled();
});
test("corrupt cart and blocked browser storage are handled", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("greenstore.cart.v1", "not json"),
  );
  await page.goto("/cart");
  await expect(
    page.getByRole("heading", { name: "Здесь будет ваш сад" }),
  ).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(Storage.prototype, "setItem", {
      value: () => {
        throw new DOMException("Quota", "QuotaExceededError");
      },
      configurable: true,
    });
  });
  await page.goto("/catalog/thuja-smaragd");
  // Navigation replaces the document, so install the quota simulation in this page too.
  await page.evaluate(() => {
    Object.defineProperty(Storage.prototype, "setItem", {
      value: () => {
        throw new DOMException("Quota", "QuotaExceededError");
      },
      configurable: true,
    });
  });
  await page.getByRole("button", { name: "Добавить в корзину" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Браузер запретил сохранение" }),
  ).toContainText("Браузер запретил сохранение");
  await expect(page.getByTestId("cart-count")).toHaveText("1");
  await page
    .getByRole("link", { name: "Открыть корзину", exact: true })
    .click();
  await expect(page.getByTestId("cart-item")).toHaveCount(1);
});
test("info pages and responsive navigation work", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  if (isMobile) {
    await page.getByLabel("Меню", { exact: true }).click();
    await page
      .getByRole("navigation", { name: "Мобильная навигация" })
      .getByRole("link", { name: "Контакты" })
      .click();
    await expect(page.locator(".mobile-menu")).not.toHaveAttribute("open", "");
  } else {
    await page
      .getByRole("navigation", { name: "Основная навигация" })
      .getByRole("link", { name: "Контакты" })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Давайте знакомиться" }),
  ).toBeVisible();
  await page.goto("/delivery");
  await expect(
    page.getByRole("heading", { name: "От сада к саду" }),
  ).toBeVisible();
  for (const path of [
    "/catalog",
    "/catalog/thuja-smaragd",
    "/cart",
    "/contacts",
    "/delivery",
  ]) {
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      path,
    ).toBe(true);
  }
});

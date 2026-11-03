import { describe, expect, test } from "vitest";
import { catalogRepository } from "./demo-repository";
import { catalogUrl, parseFilters, startingPrice } from "./repository";
const defaults = () => parseFilters({});
describe("demo catalog", () => {
  test("partial case-insensitive search with category and price", () => {
    const f = parseFilters({
      q: "ТУЯ",
      category: "thuja",
      max: "600",
      available: "1",
    });
    const result = catalogRepository.list(f);
    expect(result.total).toBe(1);
    expect(result.products[0].slug).toBe("thuja-fire-chief");
  });
  test("stock filter omits sold-out products and variants", () => {
    expect(
      catalogRepository.list({ ...defaults(), available: true }).total,
    ).toBe(11);
    expect(
      catalogRepository.list(
        parseFilters({ q: "Файер", min: "1000", available: "1" }),
      ).total,
    ).toBe(0);
  });
  test("price sort, pagination and page clamping preserve every product", () => {
    const f = { ...defaults(), sort: "price-asc" as const };
    const first = catalogRepository.list(f);
    const second = catalogRepository.list({ ...f, page: 999 });
    expect(first.products).toHaveLength(8);
    expect(second.products).toHaveLength(4);
    expect(second.page).toBe(2);
    const prices = [...first.products, ...second.products].map(startingPrice);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(
      new Set([...first.products, ...second.products].map((p) => p.id)).size,
    ).toBe(12);
  });
  test("invalid params are normalized and reversed range is empty", () => {
    expect(
      parseFilters({
        q: ["a", "b"],
        min: "NaN",
        max: "-1",
        page: "Infinity",
        sort: "bad",
        category: "invalid category",
      }),
    ).toEqual(defaults());
    expect(
      catalogRepository.list(parseFilters({ min: "2000", max: "100" })).total,
    ).toBe(0);
  });
  test("pagination URL preserves filters and safely encodes input", () => {
    const f = parseFilters({
      q: "ель & туя",
      available: "1",
      category: "spruce",
      min: "100",
      sort: "price-desc",
    });
    const url = new URL(catalogUrl(f, { page: 2 }), "https://example.test");
    expect(url.searchParams.get("q")).toBe("ель & туя");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("available")).toBe("1");
    expect(url.searchParams.get("sort")).toBe("price-desc");
  });
});

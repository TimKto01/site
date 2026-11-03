import { expect, test } from "vitest";
import {
  emptyProduct,
  imageUrlSchema,
  productSchema,
  rublesToKopecks,
} from "./schemas";
test("prices are converted to exact integer kopecks", () => {
  expect(rublesToKopecks("10.01")).toBe(1001);
  expect(rublesToKopecks("12,5")).toBe(1250);
  expect(rublesToKopecks("0.29")).toBe(29);
});
test("admin product validates publishing, quantities, prices and owned-media URLs", () => {
  const draft = {
    ...emptyProduct,
    name: "Test",
    slug: "test-plant",
    sku: "T-1",
    categoryId: "cat",
    variants: [
      { ...emptyProduct.variants[0]!, label: "Small", priceRubles: "10.10" },
    ],
  };
  expect(productSchema.safeParse(draft).success).toBe(true);
  expect(
    productSchema.safeParse({ ...draft, status: "PUBLISHED" }).success,
  ).toBe(false);
  expect(
    productSchema.safeParse({
      ...draft,
      variants: [{ ...draft.variants[0], stock: -1 }],
    }).success,
  ).toBe(false);
  expect(
    productSchema.safeParse({
      ...draft,
      variants: [{ ...draft.variants[0], priceRubles: "1.001" }],
    }).success,
  ).toBe(false);
  for (const url of [
    "https://example.test/a.png",
    "/media/../../secret",
    "data:text/html,bad",
    "/illustrations/evil.svg",
  ])
    expect(imageUrlSchema.safeParse(url).success).toBe(false);
});

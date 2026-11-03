import { z } from "zod";
import type { CatalogFilters, Product } from "./types";
const sorts = z.enum(["newest", "price-asc", "price-desc"]);
const priceInput = z.string().regex(/^\d{1,7}$/);
export const PAGE_SIZE = 8;
export function parseFilters(
  params: Record<string, string | string[] | undefined>,
): CatalogFilters {
  const one = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : "";
  const page = Number(one("page"));
  return {
    q: one("q").trim().slice(0, 120),
    category:
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(one("category")) &&
      one("category").length <= 80
        ? one("category")
        : "",
    min: priceInput.safeParse(one("min")).success ? one("min") : "",
    max: priceInput.safeParse(one("max")).success ? one("max") : "",
    available: one("available") === "1",
    sort: sorts.safeParse(one("sort")).data ?? "newest",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}
export function startingPrice(product: Product) {
  return Math.min(...product.variants.map((v) => v.price));
}
export function catalogUrl(
  filters: CatalogFilters,
  patch: Partial<CatalogFilters> = {},
) {
  const value = { ...filters, ...patch };
  const params = new URLSearchParams();
  for (const key of ["q", "category", "min", "max"] as const)
    if (value[key]) params.set(key, value[key]);
  if (value.available) params.set("available", "1");
  if (value.sort !== "newest") params.set("sort", value.sort);
  if (value.page > 1) params.set("page", String(value.page));
  return `/catalog${params.size ? `?${params}` : ""}`;
}

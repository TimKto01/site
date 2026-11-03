import { z } from "zod";
import { categories, demoProducts } from "./demo-data";
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
    category: categories.some((c) => c.slug === one("category"))
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
// Replace this adapter with a PostgreSQL repository in stage 2.
export const catalogRepository = {
  categories: () => categories,
  findBySlug: (slug: string) => demoProducts.find((p) => p.slug === slug),
  list: (f: CatalogFilters) => {
    const normalize = (text: string) =>
      text.toLocaleLowerCase("ru").replaceAll("ё", "е");
    const found = demoProducts.filter((p) => {
      const variants = p.variants.filter((v) => !f.available || v.stock > 0);
      return (
        normalize(p.name).includes(normalize(f.q)) &&
        (!f.category || p.category === f.category) &&
        variants.some(
          (v) =>
            (!f.min || v.price >= Number(f.min) * 100) &&
            (!f.max || v.price <= Number(f.max) * 100),
        )
      );
    });
    found.sort((a, b) =>
      f.sort === "price-asc"
        ? startingPrice(a) - startingPrice(b)
        : f.sort === "price-desc"
          ? startingPrice(b) - startingPrice(a)
          : b.publishedAt - a.publishedAt,
    );
    const pages = Math.max(1, Math.ceil(found.length / PAGE_SIZE));
    const page = Math.min(f.page, pages);
    return {
      products: found.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      total: found.length,
      pages,
      page,
    };
  },
};

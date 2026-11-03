import "server-only";
import { cache } from "react";
import { Prisma } from "@/generated/prisma/client";
import type { CatalogRepository, Product } from "@/modules/catalog/types";
import { PAGE_SIZE } from "@/modules/catalog/repository";
import { getDb } from "./db";
const include = {
  category: true,
  variants: { where: { active: true }, orderBy: { sortOrder: "asc" } },
  images: { orderBy: { sortOrder: "asc" } },
  attributes: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProductInclude;
type RecordProduct = Prisma.ProductGetPayload<{ include: typeof include }>;
function publicProduct(p: RecordProduct): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    latin: p.latin,
    description: p.description,
    shortDescription: p.shortDescription,
    category: p.category.slug,
    isDemo: p.isDemo,
    isNew: p.isNew,
    publishedAt: p.createdAt.getTime(),
    image: p.images[0]?.url ?? "/illustrations/shrub.svg",
    images: p.images.map(({ url, alt }) => ({ url, alt })),
    attributes: p.attributes.map(({ name, value }) => ({ name, value })),
    variants: p.variants.map(({ id, label, price, stock, container }) => ({
      id,
      label,
      price,
      stock,
      container,
    })),
  };
}
const findBySlug = cache(async (slug: string) => {
  const p = await getDb().product.findFirst({
    where: { slug, status: "PUBLISHED" },
    include,
  });
  return p ? publicProduct(p) : undefined;
});
export const catalogRepository: CatalogRepository = {
  categories: cache(async () =>
    getDb().category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ),
  findBySlug,
  async list(f) {
    const price = {
      ...(f.min ? { gte: Number(f.min) * 100 } : {}),
      ...(f.max ? { lte: Number(f.max) * 100 } : {}),
    };
    const where: Prisma.ProductWhereInput = {
      status: "PUBLISHED",
      ...(f.q
        ? {
            searchName: {
              contains: f.q.toLocaleLowerCase("ru").replaceAll("ё", "е"),
            },
          }
        : {}),
      ...(f.category ? { category: { slug: f.category } } : {}),
      variants: {
        some: {
          active: true,
          ...(f.available ? { stock: { gt: 0 } } : {}),
          price,
        },
      },
    };
    return getDb().$transaction(
      async (tx) => {
        const total = await tx.product.count({ where });
        const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        const page = Math.min(f.page, pages);
        const orderBy: Prisma.ProductOrderByWithRelationInput =
          f.sort === "newest"
            ? { createdAt: "desc" }
            : { minPrice: f.sort === "price-asc" ? "asc" : "desc" };
        const products = await tx.product.findMany({
          where,
          include,
          orderBy: [orderBy, { id: "asc" }],
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        });
        return { products: products.map(publicProduct), total, pages, page };
      },
      { isolationLevel: "RepeatableRead" },
    );
  },
};
export const getHomeProducts = cache(async () => {
  const db = getDb();
  const [featured, newProducts] = await Promise.all([
    db.product.findMany({
      where: { status: "PUBLISHED" },
      include,
      orderBy: { createdAt: "asc" },
      take: 4,
    }),
    db.product.findMany({
      where: { status: "PUBLISHED", isNew: true },
      include,
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);
  return {
    featured: featured.map(publicProduct),
    newProducts: newProducts.map(publicProduct),
  };
});
export async function resolveCart(variantIds: string[]) {
  const products = await getDb().product.findMany({
    where: {
      status: "PUBLISHED",
      variants: { some: { id: { in: variantIds }, active: true } },
    },
    include,
  });
  return products.map(publicProduct);
}

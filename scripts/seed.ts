import "dotenv/config";
import { getDb } from "../src/server/client";
import { categories, demoProducts } from "../src/modules/catalog/demo-data";
const db = getDb();
try {
  await db.$transaction(async (tx) => {
    await tx.storeSetting.upsert({
      where: { id: "store" },
      update: {},
      create: { id: "store" },
    });
    if (await tx.auditLog.findUnique({ where: { id: "seed-catalog-v1" } }))
      return;
    for (const [sortOrder, c] of categories.entries())
      await tx.category.upsert({
        where: { slug: c.slug },
        update: {},
        create: { ...c, image: `/illustrations/${c.image}.svg`, sortOrder },
      });
    await tx.storeSetting.upsert({
      where: { id: "store" },
      update: {},
      create: { id: "store" },
    });
    for (const [index, p] of demoProducts.entries()) {
      if (
        await tx.product.findFirst({
          where: { OR: [{ id: p.id }, { sku: p.sku }, { slug: p.slug }] },
        })
      )
        continue; // Never overwrite admin edits.
      const category = await tx.category.findUniqueOrThrow({
        where: { slug: p.category },
      });
      await tx.product.create({
        data: {
          id: p.id,
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          searchName: p.name.toLocaleLowerCase("ru").replaceAll("ё", "е"),
          latin: p.latin,
          description: p.description,
          categoryId: category.id,
          status: "PUBLISHED",
          isDemo: true,
          isNew: p.isNew,
          minPrice: Math.min(...p.variants.map((v) => v.price)),
          createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)),
          variants: {
            create: p.variants.map((v, sortOrder) => ({
              ...v,
              sortOrder,
              movements: {
                create: {
                  delta: v.stock,
                  reason: "Демонстрационные начальные данные",
                },
              },
            })),
          },
          images: { create: { url: p.image, alt: `Иллюстрация: ${p.name}` } },
          attributes: {
            create: p.attributes.map((a, sortOrder) => ({ ...a, sortOrder })),
          },
        },
      });
    }
    await tx.auditLog.create({
      data: {
        id: "seed-catalog-v1",
        action: "CATALOG_SEEDED",
        entityId: "demo-v1",
        summary: "Добавлен демонстрационный каталог",
      },
    });
  });
  console.log(
    "Seed complete; existing catalog entries and settings were preserved.",
  );
} finally {
  await db.$disconnect();
}

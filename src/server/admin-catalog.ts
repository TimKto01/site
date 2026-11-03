import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import {
  productSchema,
  categorySchema,
  settingsSchema,
  rublesToKopecks,
} from "@/modules/admin/schemas";
import { getDb } from "./db";
import { HttpError } from "./errors";
async function validateImages(urls: string[]) {
  const uploaded = urls
    .filter((url) => url.startsWith("/media/"))
    .map((url) => url.slice(7));
  if (!uploaded.length) return;
  const count = await getDb().uploadAsset.count({
    where: { key: { in: [...new Set(uploaded)] } },
  });
  if (count !== new Set(uploaded).size)
    throw new HttpError(422, "Загрузите изображение перед сохранением");
}
export async function saveProduct(raw: unknown, actorId: string, id?: string) {
  const data = productSchema.parse(raw);
  await validateImages(data.images.map((img) => img.url));
  const db = getDb();
  return db.$transaction(
    async (tx) => {
      const existing = id
        ? await tx.product.findUnique({
            where: { id },
            include: { variants: true },
          })
        : null;
      if (id && !existing) throw new HttpError(404, "Товар не найден");
      if (existing && data.version !== existing.updatedAt.toISOString())
        throw new HttpError(
          409,
          "Товар уже изменён. Обновите страницу, чтобы не потерять чужие изменения.",
        );
      if (
        data.variants.some(
          (v) => v.id && !existing?.variants.some((old) => old.id === v.id),
        )
      )
        throw new HttpError(422, "Вариант не принадлежит этому товару");
      const productId = id ?? randomUUID();
      const scalars = {
        name: data.name,
        searchName: data.name.toLocaleLowerCase("ru").replaceAll("ё", "е"),
        slug: data.slug,
        sku: data.sku,
        latin: data.latin,
        description: data.description,
        shortDescription: data.shortDescription,
        categoryId: data.categoryId,
        status: data.status,
        isDemo: data.isDemo,
        isNew: data.isNew,
        shippingAllowed: data.shippingAllowed,
        shippingNote: data.shippingNote,
        minPrice: Math.min(
          ...data.variants.map((v) => rublesToKopecks(v.priceRubles)),
        ),
      };
      if (existing) {
        const updated = await tx.product.updateMany({
          where: { id: productId, updatedAt: existing.updatedAt },
          data: { ...scalars, updatedAt: new Date() },
        });
        if (updated.count !== 1)
          throw new HttpError(
            409,
            "Товар одновременно изменился. Обновите страницу.",
          );
      } else {
        await tx.product.create({ data: { id: productId, ...scalars } });
      }
      const activeIds: string[] = [];
      for (const [sortOrder, variant] of data.variants.entries()) {
        const variantId = variant.id ?? randomUUID();
        activeIds.push(variantId);
        const { priceRubles, id: ignoredId, ...values } = variant;
        void ignoredId;
        await tx.productVariant.upsert({
          where: { id: variantId },
          create: {
            ...values,
            id: variantId,
            productId,
            price: rublesToKopecks(priceRubles),
            sortOrder,
          },
          update: {
            ...values,
            price: rublesToKopecks(priceRubles),
            sortOrder,
            active: true,
          },
        });
        const previous =
          existing?.variants.find((v) => v.id === variantId)?.stock ?? 0;
        if (previous !== variant.stock)
          await tx.inventoryMovement.create({
            data: {
              variantId,
              delta: variant.stock - previous,
              reason: existing
                ? "Изменение остатка в админке"
                : "Начальный остаток товара",
              actorId,
            },
          });
      }
      await tx.productVariant.updateMany({
        where: { productId, id: { notIn: activeIds } },
        data: { active: false },
      });
      await tx.productImage.deleteMany({ where: { productId } });
      if (data.images.length)
        await tx.productImage.createMany({
          data: data.images.map((image, sortOrder) => ({
            ...image,
            productId,
            sortOrder,
          })),
        });
      await tx.productAttribute.deleteMany({ where: { productId } });
      if (data.attributes.length)
        await tx.productAttribute.createMany({
          data: data.attributes.map((a, sortOrder) => ({
            ...a,
            productId,
            sortOrder,
          })),
        });
      await tx.auditLog.create({
        data: {
          actorId,
          action: existing ? "PRODUCT_UPDATED" : "PRODUCT_CREATED",
          entityId: productId,
          summary: `${data.name}: ${data.status}`,
        },
      });
      return { id: productId, slug: data.slug };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 15000,
    },
  );
}
export async function archiveProduct(id: string, actorId: string) {
  return getDb().$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "PRODUCT_ARCHIVED",
        entityId: id,
        summary: product.name,
      },
    });
    return { id };
  });
}
export async function saveCategory(raw: unknown, actorId: string, id?: string) {
  const data = categorySchema.parse(raw);
  await validateImages([data.image]);
  return getDb().$transaction(async (tx) => {
    const category = id
      ? await tx.category.update({ where: { id }, data })
      : await tx.category.create({ data });
    await tx.auditLog.create({
      data: {
        actorId,
        action: id ? "CATEGORY_UPDATED" : "CATEGORY_CREATED",
        entityId: category.id,
        summary: category.name,
      },
    });
    return { id: category.id };
  });
}
export async function deleteCategory(id: string, actorId: string) {
  return getDb().$transaction(async (tx) => {
    if (await tx.product.count({ where: { categoryId: id } }))
      throw new HttpError(
        409,
        "В категории есть товары, включая архивные. Сначала перенесите их в другую категорию.",
      );
    const category = await tx.category.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "CATEGORY_DELETED",
        entityId: id,
        summary: category.name,
      },
    });
    return { id };
  });
}
export async function saveSettings(raw: unknown, actorId: string) {
  const data = settingsSchema.parse(raw);
  if (data.logo) await validateImages([data.logo]);
  return getDb().$transaction(async (tx) => {
    await tx.storeSetting.upsert({
      where: { id: "store" },
      create: { id: "store", ...data },
      update: data,
    });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "SETTINGS_UPDATED",
        entityId: "store",
        summary: "Обновлены настройки магазина",
      },
    });
    return { saved: true };
  });
}
export async function productForEditor(id: string) {
  const product = await getDb().product.findUnique({
    where: { id },
    include: {
      variants: { where: { active: true }, orderBy: { sortOrder: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
      attributes: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!product) return null;
  return productSchema.parse({
    ...product,
    version: product.updatedAt.toISOString(),
    variants: product.variants.map((v) => ({
      ...v,
      priceRubles: (v.price / 100).toFixed(2),
    })),
    images: product.images.map(({ url, alt }) => ({ url, alt })),
    attributes: product.attributes.map(({ name, value }) => ({ name, value })),
  });
}

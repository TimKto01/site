import { z } from "zod";
const text = (max: number) =>
  z.string().trim().max(max, `Максимум ${max} символов`);
export const slugSchema = text(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Используйте латиницу, цифры и дефисы")
  .min(1);
export const imageUrlSchema = z
  .string()
  .regex(
    /^\/(?:illustrations\/(?:thuja|juniper|spruce|pine|shrub|flower)\.svg|media\/[a-f0-9-]{36}\.webp)$/,
    "Используйте загруженное изображение или иллюстрацию магазина",
  );
export const loginSchema = z.object({
  username: text(80)
    .min(1, "Введите логин")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Неверный формат логина"),
  password: z.string().min(1, "Введите пароль").max(128),
});
export const categorySchema = z.object({
  name: text(100).min(1, "Введите название"),
  slug: slugSchema,
  caption: text(200),
  image: imageUrlSchema,
  sortOrder: z
    .number()
    .int("Введите целое число")
    .min(0, "Значение не может быть отрицательным")
    .max(10000),
});
const rubles = z
  .string()
  .trim()
  .regex(
    /^\d{1,7}(?:[.,]\d{1,2})?$/,
    "Введите цену в рублях, не более двух знаков после запятой",
  );
export function rublesToKopecks(value: string) {
  const [whole, decimals = ""] = value.replace(",", ".").split(".");
  return Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
}
export const variantSchema = z.object({
  id: z.string().max(120).optional(),
  label: text(100).min(1, "Введите размер"),
  priceRubles: rubles,
  stock: z
    .number()
    .int("Введите целое число")
    .min(0, "Значение не может быть отрицательным")
    .max(1000000),
  container: text(80),
  weightGrams: z
    .number()
    .int("Введите целое число")
    .min(0, "Значение не может быть отрицательным")
    .max(1000000),
  lengthMm: z
    .number()
    .int("Введите целое число")
    .min(0, "Значение не может быть отрицательным")
    .max(100000),
  widthMm: z
    .number()
    .int("Введите целое число")
    .min(0, "Значение не может быть отрицательным")
    .max(100000),
  heightMm: z
    .number()
    .int("Введите целое число")
    .min(0, "Значение не может быть отрицательным")
    .max(100000),
});
export const productSchema = z
  .object({
    version: z.string().optional(),
    name: text(200).min(1, "Введите название"),
    slug: slugSchema,
    sku: text(80).min(1, "Введите артикул"),
    latin: text(200),
    description: text(15000),
    shortDescription: text(500),
    categoryId: z.string().min(1, "Выберите категорию").max(120),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    isDemo: z.boolean(),
    isNew: z.boolean(),
    shippingAllowed: z.boolean(),
    shippingNote: text(1000),
    variants: z
      .array(variantSchema)
      .min(1, "Добавьте хотя бы один вариант")
      .max(30),
    images: z.array(z.object({ url: imageUrlSchema, alt: text(200) })).max(8),
    attributes: z
      .array(z.object({ name: text(100).min(1), value: text(1000).min(1) }))
      .max(40),
  })
  .superRefine((value, ctx) => {
    const ids = value.variants.flatMap((v) => (v.id ? [v.id] : []));
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: "custom",
        path: ["variants"],
        message: "Вариант указан дважды",
      });
    if (
      value.status === "PUBLISHED" &&
      (!value.images.length || !value.description)
    )
      ctx.addIssue({
        code: "custom",
        path: ["status"],
        message: "Для публикации добавьте описание и изображение",
      });
  });
export const settingsSchema = z.object({
  name: text(80).min(1),
  logo: z.union([z.literal(""), imageUrlSchema]),
  heroTitle: text(160).min(1),
  heroDescription: text(800),
  storyTitle: text(160),
  storyText: text(2000),
  phone: text(60),
  email: z.union([z.literal(""), z.email().max(200)]),
  address: text(500),
  hours: text(200),
  lowStockThreshold: z
    .number()
    .int("Введите целое число")
    .min(0, "Значение не может быть отрицательным")
    .max(1000000),
});
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export const emptyVariant = {
  label: "",
  priceRubles: "0",
  stock: 0,
  container: "",
  weightGrams: 0,
  lengthMm: 0,
  widthMm: 0,
  heightMm: 0,
};
export const emptyProduct: ProductInput = {
  name: "",
  slug: "",
  sku: "",
  latin: "",
  description: "",
  shortDescription: "",
  categoryId: "",
  status: "DRAFT",
  isDemo: true,
  isNew: false,
  shippingAllowed: false,
  shippingNote: "",
  variants: [emptyVariant],
  images: [],
  attributes: [],
};

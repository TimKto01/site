import { requireAdminPage } from "@/server/auth";
import { CategoryForm } from "@/components/admin/forms";
import { getDb } from "@/server/db";
export default async function CategoriesPage() {
  await requireAdminPage();
  const categories = await getDb().category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  return (
    <>
      <h1 className="serif mb-8 text-4xl">Категории</h1>
      <section className="admin-panel">
        <h2>Новая категория</h2>
        <CategoryForm />
      </section>
      <div className="grid gap-6">
        {categories.map((c) => (
          <section className="admin-panel" key={c.id}>
            <h2>{c.name}</h2>
            <p className="mb-5 text-xs text-secondary">
              Связанных товаров: {c._count.products}. Удаление возможно только
              для пустой категории.
            </p>
            <CategoryForm
              id={c.id}
              initial={{
                name: c.name,
                slug: c.slug,
                caption: c.caption,
                image: c.image,
                sortOrder: c.sortOrder,
              }}
            />
          </section>
        ))}
      </div>
    </>
  );
}

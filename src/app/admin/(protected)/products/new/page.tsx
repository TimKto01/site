import { requireAdminPage } from "@/server/auth";
import { ProductForm } from "@/components/admin/forms";
import { getDb } from "@/server/db";
export default async function NewProduct() {
  await requireAdminPage();
  const categories = await getDb().category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return (
    <>
      <h1 className="serif mb-8 text-4xl">Новый товар</h1>
      {!categories.length && (
        <p className="notice mb-5">Сначала создайте категорию.</p>
      )}
      <ProductForm categories={categories} />
    </>
  );
}

import { requireAdminPage } from "@/server/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/forms";
import { getDb } from "@/server/db";
import { productForEditor } from "@/server/admin-catalog";
export default async function EditProduct({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const [initial, categories, query] = await Promise.all([
    productForEditor(id),
    getDb().category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    searchParams,
  ]);
  if (!initial) notFound();
  return (
    <>
      <div className="section-heading">
        <h1 className="serif text-4xl">Редактировать растение</h1>
        {initial.status === "PUBLISHED" && (
          <Link href={`/catalog/${initial.slug}`} className="text-link">
            Посмотреть на витрине ↗
          </Link>
        )}
      </div>
      <ProductForm
        id={id}
        initial={initial}
        categories={categories}
        saved={query.saved === "1"}
      />
    </>
  );
}

import { requireAdminPage } from "@/server/auth";
import Link from "next/link";
import { getDb } from "@/server/db";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const one = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : "";
  const q = one("q").slice(0, 120);
  const requestedPage = Number(one("page"));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(10000, requestedPage)
      : 1;
  const status = ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(one("status"))
    ? (one("status") as "DRAFT" | "PUBLISHED" | "ARCHIVED")
    : undefined;
  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [products, total] = await Promise.all([
    getDb().product.findMany({
      where,
      include: { category: true, variants: { where: { active: true } } },
      orderBy: { updatedAt: "desc" },
      take: 30,
      skip: (page - 1) * 30,
    }),
    getDb().product.count({ where }),
  ]);
  const url = (p: number) =>
    `/admin/products?${new URLSearchParams({ q, status: status ?? "", page: String(p) })}`;
  return (
    <>
      <div className="section-heading">
        <h1 className="serif text-4xl">Товары</h1>
        <Button asChild>
          <Link href="/admin/products/new">Добавить товар</Link>
        </Button>
      </div>
      <form className="admin-search" action="/admin/products">
        <input
          className="field"
          name="q"
          aria-label="Поиск товаров"
          defaultValue={q}
          placeholder="Название или артикул"
        />
        <select
          className="field"
          name="status"
          aria-label="Фильтр статуса"
          defaultValue={status ?? ""}
        >
          <option value="">Все статусы</option>
          <option value="PUBLISHED">Опубликованные</option>
          <option value="DRAFT">Черновики</option>
          <option value="ARCHIVED">Архив</option>
        </select>
        <Button type="submit" variant="outline">
          Найти
        </Button>
      </form>
      <p className="mb-4 text-sm text-secondary">Всего: {total}</p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Товар</th>
              <th>Категория</th>
              <th>Цена от</th>
              <th>Остаток</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link
                    className="font-medium underline underline-offset-4"
                    href={`/admin/products/${p.id}`}
                  >
                    {p.name}
                  </Link>
                  <p className="mt-1 text-xs text-secondary">{p.sku}</p>
                </td>
                <td>{p.category.name}</td>
                <td>{formatMoney(p.minPrice)}</td>
                <td>{p.variants.reduce((sum, v) => sum + v.stock, 0)}</td>
                <td>
                  {
                    {
                      DRAFT: "Черновик",
                      PUBLISHED: "Опубликован",
                      ARCHIVED: "Архив",
                    }[p.status]
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!products.length && (
        <p className="notice">По этому запросу товаров нет.</p>
      )}
      <nav className="mt-6 flex gap-5" aria-label="Страницы товаров">
        {page > 1 && <Link href={url(page - 1)}>← Назад</Link>}
        {page * 30 < total && <Link href={url(page + 1)}>Далее →</Link>}
      </nav>
    </>
  );
}

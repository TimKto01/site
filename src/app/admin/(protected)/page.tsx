import { requireAdminPage } from "@/server/auth";
import Link from "next/link";
import { getDb } from "@/server/db";
import { getSettings } from "@/server/settings";
export default async function Dashboard() {
  await requireAdminPage();
  const db = getDb();
  const settings = await getSettings();
  const [published, drafts, archived, lowStock, history] = await Promise.all([
    db.product.count({ where: { status: "PUBLISHED" } }),
    db.product.count({ where: { status: "DRAFT" } }),
    db.product.count({ where: { status: "ARCHIVED" } }),
    db.productVariant.count({
      where: {
        active: true,
        stock: { lte: settings.lowStockThreshold },
        product: { status: { not: "ARCHIVED" } },
      },
    }),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { actor: { select: { username: true } } },
    }),
  ]);
  return (
    <>
      <h1 className="serif mb-8 text-4xl">Обзор магазина</h1>
      <div className="admin-stats">
        {[
          ["Опубликовано", published],
          ["Черновики", drafts],
          ["В архиве", archived],
          ["Мало на складе", lowStock],
        ].map(([title, value]) => (
          <div className="admin-panel" key={title}>
            <p className="text-xs text-secondary">{title}</p>
            <strong className="mt-3 block text-3xl">{value}</strong>
          </div>
        ))}
      </div>
      <p className="notice my-6">
        Заказы, оплаты и продажи появятся на следующих этапах. Здесь показаны
        только данные каталога.
      </p>
      <section className="admin-panel">
        <h2>Последние действия</h2>
        {history.length ? (
          <ul className="admin-audit">
            {history.map((entry) => (
              <li key={entry.id}>
                <time>
                  {new Intl.DateTimeFormat("ru-RU", {
                    dateStyle: "short",
                    timeStyle: "short",
                    timeZone: "Europe/Moscow",
                  }).format(entry.createdAt)}
                </time>
                <span>{entry.summary}</span>
                <span>{entry.actor?.username ?? "Система"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>История пока пуста.</p>
        )}
      </section>
      <Link className="text-link mt-6" href="/admin/products/new">
        Добавить первое растение →
      </Link>
    </>
  );
}

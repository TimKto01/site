import type { Metadata } from "next";
import Link from "next/link";
import { Search, SlidersHorizontal, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterPanel } from "@/components/store/filter-panel";
import { ProductCard } from "@/components/store/product-card";
import { catalogUrl, parseFilters } from "@/modules/catalog/repository";
import { catalogRepository } from "@/server/catalog";
export const metadata: Metadata = { title: "Каталог растений" };
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = parseFilters(await searchParams);
  const [result, categories] = await Promise.all([
    catalogRepository.list(f),
    catalogRepository.categories(),
  ]);
  return (
    <div className="container">
      <nav aria-label="Хлебные крошки" className="breadcrumb">
        <Link href="/">Главная</Link>
        <span>/</span>
        <span>Каталог</span>
      </nav>
      <div className="page-heading">
        <p className="eyebrow mb-3">ДЛЯ САДА, КОТОРЫЙ ВЫ ЛЮБИТЕ</p>
        <h1 className="serif">Каталог растений</h1>
        <p>
          Начните с одного растения — или задумайте целый сад. Выберите
          категорию, размер и подходящий вариант.
        </p>
      </div>
      <p className="notice mb-8">
        Демонстрационный каталог: все цены, характеристики и остатки тестовые.
        Заказы пока не принимаются.
      </p>
      <div className="catalog-layout">
        <aside aria-label="Фильтры каталога">
          <FilterPanel>
            <form
              action="/catalog"
              className="filter-form"
              key={JSON.stringify(f)}
            >
              <h2 className="mb-6 flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal size={16} /> Подобрать растение
              </h2>
              <div className="filter-fields">
                <div className="filter-group">
                  <label className="filter-label" htmlFor="catalog-q">
                    Название
                  </label>
                  <input
                    className="field"
                    id="catalog-q"
                    name="q"
                    placeholder="Например, туя"
                    defaultValue={f.q}
                    maxLength={120}
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label" htmlFor="category">
                    Категория
                  </label>
                  <select
                    className="field"
                    id="category"
                    name="category"
                    defaultValue={f.category}
                  >
                    <option value="">Все растения</option>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <span className="filter-label">Цена, ₽</span>
                  <div className="flex gap-2">
                    <input
                      className="field min-w-0"
                      name="min"
                      type="number"
                      min="0"
                      max="9999999"
                      aria-label="Цена от"
                      placeholder="От"
                      defaultValue={f.min}
                    />
                    <input
                      className="field min-w-0"
                      name="max"
                      type="number"
                      min="0"
                      max="9999999"
                      aria-label="Цена до"
                      placeholder="До"
                      defaultValue={f.max}
                    />
                  </div>
                </div>
                <div className="filter-group">
                  <label className="filter-label" htmlFor="sort">
                    Сортировка
                  </label>
                  <select
                    id="sort"
                    name="sort"
                    className="field"
                    defaultValue={f.sort}
                  >
                    <option value="newest">Сначала новые</option>
                    <option value="price-asc">Сначала дешевле</option>
                    <option value="price-desc">Сначала дороже</option>
                  </select>
                </div>
                <label className="mb-6 flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    name="available"
                    value="1"
                    defaultChecked={f.available}
                  />{" "}
                  Есть демо-остаток
                </label>
              </div>
              <Button type="submit" className="w-full" size="sm">
                <Search size={15} /> Показать
              </Button>
              <Link
                href="/catalog"
                className="mt-4 block text-center text-xs underline underline-offset-4"
              >
                Сбросить фильтры
              </Link>
            </form>
          </FilterPanel>
        </aside>
        <section aria-label="Результаты поиска">
          <div className="results-bar">
            <p role="status">
              Найдено растений:{" "}
              <strong data-testid="result-count">{result.total}</strong>
            </p>
            <span className="text-secondary">
              Страница {result.page} из {result.pages}
            </span>
          </div>
          {f.min && f.max && Number(f.min) > Number(f.max) && (
            <p className="notice mb-5">
              Минимальная цена больше максимальной. Измените диапазон цен.
            </p>
          )}
          {result.products.length ? (
            <div className="product-grid catalog-grid">
              {result.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Sprout size={40} strokeWidth={1} />
              <h2 className="serif text-3xl">Пока ничего не нашлось</h2>
              <p className="my-5 text-sm text-secondary">
                Попробуйте другое название или измените фильтры.
              </p>
              <Button asChild variant="outline">
                <Link href="/catalog">Показать все растения</Link>
              </Button>
            </div>
          )}
          {result.pages > 1 && (
            <nav aria-label="Страницы каталога" className="pagination">
              {Array.from({ length: result.pages }, (_, i) => i + 1).map(
                (page) =>
                  page === result.page ? (
                    <span key={page} aria-current="page">
                      {page}
                    </span>
                  ) : (
                    <Link
                      key={page}
                      href={catalogUrl(f, { page })}
                      aria-label={`Страница ${page}`}
                    >
                      {page}
                    </Link>
                  ),
              )}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}

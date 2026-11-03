"use client";
import Link from "next/link";
import { ArrowUpRight, Leaf, Menu, Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/modules/cart/store";
import Image from "next/image";
import type { Category } from "@/modules/catalog/types";
export function Header({
  categories,
  name,
  logo,
}: {
  categories: Category[];
  name: string;
  logo: string;
}) {
  const { count } = useCart();
  return (
    <>
      <div className="announcement">
        <div className="container flex items-center justify-between gap-3">
          <span>Демонстрационная витрина · заказы пока не принимаются</span>
          <Link
            href="/delivery"
            className="hidden items-center gap-1 sm:inline-flex"
          >
            О доставке <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
      <header className="site-header">
        <div className="container flex h-23 items-center gap-5 md:gap-10">
          <Link href="/" aria-label={`${name} — главная`} className="brand">
            {logo ? (
              <Image src={logo} alt="" width={32} height={32} unoptimized />
            ) : (
              <Leaf strokeWidth={1.3} size={31} />
            )}
            <span>
              {name}
              <span className="brand-dot">.</span>
            </span>
          </Link>
          <form
            action="/catalog"
            role="search"
            className="header-search hidden md:flex"
          >
            <Search size={18} />
            <input
              name="q"
              aria-label="Поиск растений"
              placeholder="Найдите своё растение"
              maxLength={120}
            />
            <button aria-label="Искать">
              <ArrowUpRight size={19} />
            </button>
          </form>
          <nav
            aria-label="Основная навигация"
            className="ml-auto hidden gap-6 text-sm lg:flex"
          >
            <Link href="/delivery">Доставка</Link>
            <Link href="/contacts">Контакты</Link>
          </nav>
          <Link
            href="/cart"
            className="cart-link"
            aria-label={`Корзина, товаров: ${count}`}
          >
            <ShoppingBag size={21} strokeWidth={1.5} />
            <span className="hidden sm:inline">Корзина</span>
            <span className="cart-count" data-testid="cart-count">
              {count}
            </span>
          </Link>
          <details
            className="mobile-menu lg:hidden"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a"))
                event.currentTarget.open = false;
            }}
          >
            <summary aria-label="Меню">
              <Menu size={24} />
            </summary>
            <nav aria-label="Мобильная навигация">
              <Link href="/catalog">Все растения</Link>
              <Link href="/delivery">Доставка</Link>
              <Link href="/contacts">Контакты</Link>
              <form action="/catalog" className="flex gap-2">
                <input
                  name="q"
                  aria-label="Поиск в меню"
                  placeholder="Найти растение"
                  className="field min-w-0"
                />
                <button aria-label="Искать в меню">
                  <Search size={20} />
                </button>
              </form>
            </nav>
          </details>
        </div>
        <nav aria-label="Категории" className="category-nav">
          <div className="container flex items-center gap-7 overflow-x-auto">
            <Link
              href="/catalog"
              className="flex shrink-0 items-center gap-2 font-semibold"
            >
              <Menu size={16} /> Все растения
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/catalog?category=${c.slug}`}
                className="shrink-0"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </nav>
      </header>
    </>
  );
}

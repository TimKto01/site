import Link from "next/link";
import { ArrowUpRight, Leaf } from "lucide-react";
export function Footer({ name }: { name: string }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Link className="brand" href="/">
              <Leaf size={30} strokeWidth={1.2} /> {name}.
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-7 opacity-75">
              Место, где начинается ваш сад.
              <br />
              Растения, которые делают пространство живым.
            </p>
          </div>
          <div>
            <p className="eyebrow mb-5 opacity-60">Загляните</p>
            <nav aria-label="Ссылки в подвале" className="grid gap-3 text-sm">
              <Link href="/catalog">Каталог растений</Link>
              <Link href="/cart">Корзина</Link>
              <Link href="/delivery">Доставка и оплата</Link>
              <Link href="/contacts">О проекте и контакты</Link>
            </nav>
          </div>
          <div className="max-w-sm">
            <p className="eyebrow mb-5 opacity-60">Растём вместе</p>
            <h2 className="serif text-3xl">
              Большой сад начинается
              <br />с маленького растения.
            </h2>
            <Link
              href="/catalog"
              className="mt-6 inline-flex items-center gap-3 text-sm"
            >
              Найти своё <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {name} · демонстрационный проект
          </span>
          <span>Цены и остатки тестовые. Продажи не ведутся.</span>
        </div>
      </div>
    </footer>
  );
}

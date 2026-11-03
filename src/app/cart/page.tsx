import type { Metadata } from "next";
import Link from "next/link";
import { CartPageContent } from "@/modules/cart/cart-page";
export const metadata: Metadata = { title: "Корзина" };
export default function CartPage() {
  return (
    <div className="container">
      <nav aria-label="Хлебные крошки" className="breadcrumb">
        <Link href="/">Главная</Link>
        <span>/</span>
        <span>Корзина</span>
      </nav>
      <div className="page-heading">
        <p className="eyebrow mb-3">СОХРАНИТЕ ТО, ЧТО ПОНРАВИЛОСЬ</p>
        <h1 className="serif">Ваша корзина</h1>
        <p>Растения для ваших будущих зелёных историй.</p>
      </div>
      <CartPageContent />
    </div>
  );
}

"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import type { Product } from "@/modules/catalog/types";
import { useCart } from "./store";
export function CartPageContent() {
  const { lines, count, setQuantity, remove, persistent } = useCart();
  const key = JSON.stringify(lines);
  const [state, setState] = useState<{
    key: string;
    products: Product[];
    error: string;
  }>({ key: "", products: [], error: "" });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (key === "[]") return;
    const controller = new AbortController();
    fetch("/api/cart/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: key,
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Каталог недоступен");
        return response.json() as Promise<{ products: Product[] }>;
      })
      .then((data) => setState({ key, products: data.products, error: "" }))
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            key,
            products: [],
            error:
              error instanceof Error
                ? error.message
                : "Не удалось обновить корзину",
          });
      });
    return () => controller.abort();
  }, [key, retry]);
  if (!lines.length)
    return (
      <div className="empty-state mb-20">
        <ShoppingBag size={42} strokeWidth={1} />
        <h2 className="serif text-4xl">Здесь будет ваш сад</h2>
        <p className="my-6 text-sm leading-7 text-secondary">
          Пока в корзине пусто. Присмотритесь к растениям
          <br className="hidden sm:block" /> и добавьте первое, которое вам
          понравится.
        </p>
        <Button asChild>
          <Link href="/catalog">Выбрать растения</Link>
        </Button>
      </div>
    );
  if (state.key !== key)
    return (
      <p className="notice mb-20" role="status">
        Проверяем актуальные цены и остатки…
      </p>
    );
  if (state.error)
    return (
      <div className="notice mb-20" role="alert">
        <p>{state.error}. Товары сохранены в браузере.</p>
        <Button className="mt-4" onClick={() => setRetry((v) => v + 1)}>
          Повторить проверку
        </Button>
      </div>
    );
  const resolved = lines.map((line) => {
    for (const product of state.products) {
      const variant = product.variants.find((v) => v.id === line.variantId);
      if (variant) return { ...line, product, variant };
    }
    return { ...line, product: null, variant: null };
  });
  const total = resolved.reduce(
    (sum, line) => sum + (line.variant?.price ?? 0) * line.quantity,
    0,
  );
  return (
    <>
      {!persistent && (
        <p role="alert" className="notice mb-5">
          Сохранение в браузере недоступно. Корзина сохранится только до
          перезагрузки страницы.
        </p>
      )}
      <div className="cart-layout">
        <section aria-label="Товары в корзине">
          {resolved.map((line) => {
            if (!line.product || !line.variant)
              return (
                <article className="notice mb-4" key={line.variantId}>
                  <p>
                    Этот вариант больше недоступен. Его стоимость не включена в
                    сумму.
                  </p>
                  <button
                    className="mt-3 underline"
                    onClick={() => remove(line.variantId)}
                  >
                    Удалить недоступный вариант
                  </button>
                </article>
              );
            const { product, variant } = line;
            return (
              <article
                className="cart-item"
                key={line.variantId}
                data-testid="cart-item"
              >
                <Link
                  href={`/catalog/${product.slug}`}
                  className="cart-item-image"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <Image src={product.image} alt="" fill sizes="100px" />
                </Link>
                <div>
                  <Link
                    href={`/catalog/${product.slug}`}
                    className="text-base font-medium"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-2 text-xs leading-6 text-secondary">
                    {variant.label} · {variant.container}
                  </p>
                  <p className="mt-2 text-sm">
                    {formatMoney(variant.price)} / шт.
                  </p>
                  {line.quantity > variant.stock && (
                    <p className="mt-3 text-xs text-red-800">
                      Остаток изменился: доступно {variant.stock} шт. Уменьшите
                      количество или удалите товар.
                    </p>
                  )}
                  <button
                    className="mt-3 flex items-center gap-2 text-xs text-secondary"
                    aria-label={`Удалить ${product.name}, ${variant.label}`}
                    onClick={() => remove(variant.id)}
                  >
                    <Trash2 size={13} /> Удалить
                  </button>
                </div>
                <div className="cart-item-controls flex flex-col items-start gap-4">
                  <strong className="font-medium">
                    {formatMoney(variant.price * line.quantity)}
                  </strong>
                  <div className="quantity-control">
                    <button
                      aria-label={`Уменьшить ${product.name}, ${variant.label}`}
                      disabled={line.quantity <= 1}
                      onClick={() => setQuantity(variant.id, line.quantity - 1)}
                    >
                      <Minus size={15} />
                    </button>
                    <output
                      aria-label={`Количество ${product.name}, ${variant.label}`}
                    >
                      {line.quantity}
                    </output>
                    <button
                      aria-label={`Увеличить ${product.name}, ${variant.label}`}
                      disabled={
                        line.quantity >= variant.stock || line.quantity >= 99
                      }
                      onClick={() => setQuantity(variant.id, line.quantity + 1)}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          <Link href="/catalog" className="text-link mt-8">
            ← Продолжить выбирать
          </Link>
        </section>
        <aside className="cart-summary" aria-label="Сумма корзины">
          <p className="eyebrow mb-5">ВАШ ЗЕЛЁНЫЙ ВЫБОР</p>
          <h2 className="serif mb-7 text-3xl">В корзине</h2>
          <div className="flex justify-between text-sm">
            <span>Растений: {count}</span>
            <span data-testid="cart-subtotal">{formatMoney(total)}</span>
          </div>
          <p className="mt-4 text-xs leading-6 text-secondary">
            Доставка не рассчитана. Возможность доставки будет определяться при
            оформлении на следующем этапе.
          </p>
          <div className="my-6 flex justify-between border-t border-border pt-5 font-medium">
            <span>Сумма товаров</span>
            <span data-testid="cart-total">{formatMoney(total)}</span>
          </div>
          <Button disabled className="w-full text-xs">
            Оформление появится позже
          </Button>
          <p className="mt-4 text-xs leading-6 text-secondary">
            Цены и остатки получены из каталога. Товар не резервируется. Заказ
            не создаётся, оплата не принимается.
          </p>
        </aside>
      </div>
    </>
  );
}

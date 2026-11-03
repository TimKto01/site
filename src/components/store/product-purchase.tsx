"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { useCart } from "@/modules/cart/store";
import type { Product } from "@/modules/catalog/types";
export function ProductPurchase({ product }: { product: Product }) {
  const { lines, add, persistent } = useCart();
  const [selected, setSelected] = useState(product.variants[0].id);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const variant = product.variants.find((v) => v.id === selected)!;
  const inCart =
    lines.find((line) => line.variantId === selected)?.quantity ?? 0;
  const remaining = Math.max(0, variant.stock - inCart);
  const amount = Math.min(quantity, remaining);
  return (
    <div className="purchase">
      <fieldset>
        <legend className="mb-3 text-sm font-medium">Размер растения</legend>
        <div className="flex flex-wrap gap-2">
          {product.variants.map((v) => (
            <label
              key={v.id}
              className={`variant-option ${selected === v.id ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="variant"
                value={v.id}
                checked={selected === v.id}
                onChange={() => {
                  setSelected(v.id);
                  setQuantity(1);
                  setMessage("");
                }}
              />
              <span>{v.label}</span>
              {v.stock === 0 && <span className="text-xs">Нет в демо</span>}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="my-6 flex items-end justify-between gap-3">
        <strong className="text-3xl font-medium" data-testid="variant-price">
          {formatMoney(variant.price)}
        </strong>
        <span className="text-sm text-secondary">
          {variant.stock > 0
            ? `${product.isDemo ? "Тестовый остаток" : "Остаток"}: ${variant.stock} шт.`
            : "Нет в наличии в демо"}
        </span>
      </div>
      <p className="mb-5 text-sm text-secondary">
        Контейнер: {variant.container}.{" "}
        {inCart > 0 ? `Уже в корзине: ${inCart} шт.` : ""}
      </p>
      <div className="flex flex-wrap gap-3">
        <div className="quantity-control">
          <button
            type="button"
            aria-label="Уменьшить количество"
            disabled={amount <= 1}
            onClick={() => setQuantity(Math.max(1, amount - 1))}
          >
            <Minus size={16} />
          </button>
          <output aria-label="Количество">{amount || 0}</output>
          <button
            type="button"
            aria-label="Увеличить количество"
            disabled={amount >= remaining}
            onClick={() => setQuantity(Math.min(remaining, amount + 1))}
          >
            <Plus size={16} />
          </button>
        </div>
        <Button
          className="grow"
          disabled={remaining === 0}
          onClick={() => {
            add(selected, amount);
            setQuantity(1);
            setMessage(`Добавлено в корзину: ${amount} шт.`);
          }}
        >
          <ShoppingBag size={18} />
          {remaining === 0
            ? variant.stock
              ? "Весь демо-остаток в корзине"
              : "Нет в наличии"
            : "Добавить в корзину"}
        </Button>
      </div>
      <div
        role="status"
        aria-label="Добавление в корзину"
        className="mt-4 min-h-7 text-sm text-primary"
      >
        {message && (
          <span className="flex flex-wrap items-center gap-2">
            <Check size={16} />
            {message}{" "}
            <Link className="underline underline-offset-4" href="/cart">
              Открыть корзину
            </Link>
          </span>
        )}
      </div>
      {!persistent && (
        <p role="alert" className="notice">
          Браузер запретил сохранение. Корзина доступна до перезагрузки
          страницы.
        </p>
      )}
      <p className="mt-3 border-t border-border pt-5 text-xs leading-6 text-secondary">
        {product.isDemo
          ? "Это демонстрационный товар. Цены, размеры и остатки тестовые. "
          : ""}
        Добавление в корзину не создаёт заказ и не резервирует растение.
      </p>
    </div>
  );
}

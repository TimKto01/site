import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/modules/catalog/types";
import { startingPrice } from "@/modules/catalog/repository";
import { formatMoney } from "@/lib/utils";
export function ProductCard({ product }: { product: Product }) {
  const inStock = product.variants.some((v) => v.stock > 0);
  return (
    <article className="product-card">
      <Link
        href={`/catalog/${product.slug}`}
        className="product-art"
        tabIndex={-1}
        aria-hidden="true"
      >
        <Image
          src={product.image}
          alt=""
          fill
          sizes="(max-width: 639px) 90vw, (max-width: 1023px) 45vw, 25vw"
        />
        <span className="product-tag">
          {!inStock
            ? "Нет в демо"
            : product.isNew
              ? "Новинка"
              : product.isDemo
                ? "Демо-растение"
                : "Коллекция сада"}
        </span>
        <span className="product-arrow">
          <ArrowUpRight size={20} />
        </span>
      </Link>
      <p className="latin mt-5">{product.latin}</p>
      <h3 className="mt-2 text-lg leading-snug">
        <Link href={`/catalog/${product.slug}`}>{product.name}</Link>
      </h3>
      <p className="mt-2 text-sm text-secondary">
        {product.variants[0].label} <span className="mx-2 opacity-40">/</span>{" "}
        {product.variants[0].container.replace("Тестовый ", "")}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-lg font-semibold">
          от {formatMoney(startingPrice(product))}
        </span>
        <span
          className={`text-xs ${inStock ? "text-primary" : "text-secondary"}`}
        >
          {inStock
            ? product.isDemo
              ? "● Демо-остаток"
              : "● В наличии"
            : "Нет в наличии"}
        </span>
      </div>
    </article>
  );
}

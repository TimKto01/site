"use client";
import { useState } from "react";
import Image from "next/image";
import type { Product } from "@/modules/catalog/types";
export function ProductGallery({ product }: { product: Product }) {
  const images = product.images?.length
    ? product.images
    : [{ url: product.image, alt: product.name }];
  const [selected, setSelected] = useState(0);
  const active = images[Math.min(selected, images.length - 1)]!;
  return (
    <div>
      <div className="detail-art">
        <Image
          src={active.url}
          alt={active.alt || product.name}
          fill
          sizes="(max-width: 767px) 90vw, 48vw"
          preload
        />
        {product.isDemo && (
          <span className="product-tag">Демонстрационный товар</span>
        )}
      </div>
      {images.length > 1 && (
        <div
          className="mt-4 flex flex-wrap gap-3"
          aria-label="Фотографии товара"
        >
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              className={`relative h-20 w-20 rounded border ${selected === index ? "border-primary" : "border-border"}`}
              aria-label={`Показать изображение ${index + 1}`}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="80px"
                className="object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

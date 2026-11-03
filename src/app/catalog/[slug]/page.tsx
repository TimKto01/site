import type { Metadata } from "next";
import { ProductGallery } from "@/components/store/product-gallery";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { ProductPurchase } from "@/components/store/product-purchase";
import { ProductCard } from "@/components/store/product-card";
import { catalogRepository } from "@/server/catalog";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = await catalogRepository.findBySlug((await params).slug);
  return {
    title: product?.name ?? "Растение не найдено",
    description: product
      ? `${product.name}: варианты размеров и тестовые характеристики в демонстрационном каталоге GreenStore.`
      : undefined,
  };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const product = await catalogRepository.findBySlug((await params).slug);
  if (!product) notFound();
  const category = (await catalogRepository.categories()).find(
    (c) => c.slug === product.category,
  )!;
  const related = (
    await catalogRepository.list({
      q: "",
      category: product.category,
      min: "",
      max: "",
      available: false,
      sort: "newest",
      page: 1,
    })
  ).products
    .filter((p) => p.id !== product.id)
    .slice(0, 4);
  return (
    <div className="container">
      <nav aria-label="Хлебные крошки" className="breadcrumb">
        <Link href="/">Главная</Link>
        <span>/</span>
        <Link href="/catalog">Каталог</Link>
        <span>/</span>
        <Link href={`/catalog?category=${category.slug}`}>{category.name}</Link>
      </nav>
      <div className="detail-grid">
        <ProductGallery product={product} />
        <div className="py-3">
          <p className="eyebrow text-secondary">
            {category.name} / АРТИКУЛ {product.sku}
          </p>
          <h1 className="serif mt-5 text-4xl leading-tight sm:text-5xl">
            {product.name}
          </h1>
          <p className="latin mb-7 mt-3 text-base">{product.latin}</p>
          <p className="mb-8 text-sm leading-7 text-secondary">
            {product.description}
          </p>
          <ProductPurchase product={product} />
          <Link href="/delivery" className="text-link mt-5">
            О доставке и оплате <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
      <section className="mb-16 max-w-3xl">
        <p className="eyebrow mb-3">ПОЗНАКОМИМСЯ ПОБЛИЖЕ</p>
        <h2 className="serif mb-7 text-4xl">Характеристики растения</h2>
        <p className="demo-caption">
          Тестовые значения для демонстрации. Не используйте их как инструкцию
          по уходу.
        </p>
        <dl className="attributes">
          {product.attributes.map((a) => (
            <div className="attribute-row" key={a.name}>
              <dt className="text-secondary">{a.name}</dt>
              <dd>{a.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      {related.length > 0 && (
        <section className="mb-20">
          <div className="section-heading">
            <h2 className="serif section-title">Ещё в этой коллекции</h2>
          </div>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard product={p} key={p.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Flower2,
  Sprout,
  Trees,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/product-card";
import { catalogRepository, getHomeProducts } from "@/server/catalog";
import { getSettings } from "@/server/settings";
export default async function Home() {
  const [categories, { featured, newProducts }, settings] = await Promise.all([
    catalogRepository.categories(),
    getHomeProducts(),
    getSettings(),
  ]);
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow flex items-center gap-2">
            <span className="tiny-line" /> САД НАЧИНАЕТСЯ ЗДЕСЬ
          </p>
          <h1 className="serif whitespace-pre-line">{settings.heroTitle}</h1>
          <p className="hero-description">{settings.heroDescription}</p>
          <Button asChild className="hero-button">
            <Link href="/catalog">
              Выбрать растения <ArrowUpRight size={19} />
            </Link>
          </Button>
          <div className="hero-note">
            <Sprout size={21} strokeWidth={1.3} />
            <span>
              Хвойные, кустарники и цветущие растения.
              <br />
              Найдите то, что подходит именно вам.
            </span>
          </div>
          <span className="hero-index" aria-hidden="true">
            01 / ВДОХНОВЕНИЕ ДЛЯ САДА
          </span>
        </div>
        <div className="hero-art">
          <Image
            src="/illustrations/garden.svg"
            alt="Авторская иллюстрация сада с хвойными растениями и цветами в горшках"
            fill
            sizes="(max-width: 767px) 100vw, 55vw"
            preload
          />
          <div className="hero-art-label">
            <span className="eyebrow">ТИХАЯ РАДОСТЬ</span>
            <span className="serif">Быть ближе к природе</span>
            <ArrowDown size={18} />
          </div>
          <span className="illustration-mark">
            Ботаническая иллюстрация · GreenStore
          </span>
        </div>
      </section>
      <section className="container section-space">
        <div className="section-heading">
          <div>
            <p className="eyebrow">НАЙДИТЕ СВОЁ</p>
            <h2 className="serif section-title">
              У каждого сада свой характер
            </h2>
          </div>
          <Link href="/catalog" className="text-link">
            Все растения <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="category-grid">
          {categories.map((c, i) => (
            <Link
              key={c.slug}
              href={`/catalog?category=${c.slug}`}
              className="category-tile"
            >
              <span className="category-number">0{i + 1}</span>
              <div className="relative h-36">
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="(max-width: 639px) 45vw, 16vw"
                />
              </div>
              <span className="mt-2 flex items-center justify-between gap-2 text-sm font-medium">
                {c.name}
                <ArrowUpRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="container section-space">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ЗНАКОМСТВО С КОЛЛЕКЦИЕЙ</p>
            <h2 className="serif section-title">
              Маленькие растения. Большие планы.
            </h2>
          </div>
          <Link href="/catalog" className="text-link">
            В каталог <ArrowUpRight size={18} />
          </Link>
        </div>
        <p className="demo-caption">
          Демонстрационная подборка. Цены, размеры и наличие — тестовые.
        </p>
        <div className="product-grid">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      <section className="garden-story">
        <div className="container garden-story-inner">
          <div className="story-graphic">
            <Trees size={100} strokeWidth={0.65} />
            <span className="eyebrow">РАСТИ В СВОЁМ РИТМЕ</span>
          </div>
          <div>
            <p className="eyebrow">НЕ ТОЛЬКО РАСТЕНИЯ</p>
            <h2 className="serif section-title">{settings.storyTitle}</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-secondary">
              {settings.storyText}
            </p>
            <Link href="/catalog" className="text-link mt-7">
              Найти вдохновение <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      <section className="container section-space">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ЕЩЁ НЕМНОГО ЗЕЛЕНИ</p>
            <h2 className="serif section-title">Новые знакомства</h2>
          </div>
          <Link href="/catalog?sort=newest" className="text-link">
            Смотреть новинки <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="product-grid">
          {newProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      <section className="container section-space">
        <div className="benefits">
          {[
            {
              Icon: Sprout,
              title: "Растение в деталях",
              text: "Варианты размера и характеристики в каждой карточке.",
            },
            {
              Icon: Flower2,
              title: "Выбор без спешки",
              text: "Сохраняйте растения в корзине и возвращайтесь к выбору.",
            },
            {
              Icon: Truck,
              title: "Доставка с вниманием",
              text: "Условия перевозки живых растений требуют согласования.",
            },
          ].map(({ Icon, title, text }) => (
            <div key={title}>
              <Icon size={29} strokeWidth={1.2} />
              <h3 className="mt-5 font-medium">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-secondary">{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="container mb-20">
        <div className="delivery-banner">
          <div>
            <p className="eyebrow">СЛЕДУЮЩИЙ ШАГ</p>
            <h2 className="serif text-3xl sm:text-4xl">
              От нашего сада — к вашему
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6">
              Витрина работает в демонстрационном режиме. Доставка и оплата ещё
              не подключены; о будущих условиях рассказываем отдельно.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/delivery">
              О доставке и оплате <ArrowUpRight size={18} />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}

import { getSettings } from "@/server/settings";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export const metadata: Metadata = { title: "О проекте и контакты" };
export default async function ContactsPage() {
  const settings = await getSettings();
  return (
    <div className="container">
      <nav className="breadcrumb" aria-label="Хлебные крошки">
        <Link href="/">Главная</Link>
        <span>/</span>
        <span>О проекте</span>
      </nav>
      <div className="page-heading">
        <p className="eyebrow mb-3">GREENSTORE</p>
        <h1 className="serif">Давайте знакомиться</h1>
        <p>
          Мы создаём место, где выбирать растения будет так же приятно, как
          проводить время в саду.
        </p>
      </div>
      <div className="info-grid">
        <section className="info-panel">
          <h2 className="serif">Магазин в процессе роста</h2>
          <p>
            {settings.name} — название проекта интернет-магазина растений.
            Сейчас доступна демонстрационная витрина: можно исследовать каталог,
            выбирать размеры и собирать корзину. Все изображения — собственные
            иллюстрации, а данные товаров — тестовые.
          </p>
        </section>
        <section className="info-panel">
          <h2 className="serif">Как связаться</h2>
          {settings.phone ||
          settings.email ||
          settings.address ||
          settings.hours ? (
            <dl className="grid gap-3 text-sm">
              {settings.phone && (
                <div>
                  <dt className="text-secondary">Телефон</dt>
                  <dd>{settings.phone}</dd>
                </div>
              )}
              {settings.email && (
                <div>
                  <dt className="text-secondary">Электронная почта</dt>
                  <dd>{settings.email}</dd>
                </div>
              )}
              {settings.address && (
                <div>
                  <dt className="text-secondary">Адрес</dt>
                  <dd>{settings.address}</dd>
                </div>
              )}
              {settings.hours && (
                <div>
                  <dt className="text-secondary">Часы работы</dt>
                  <dd>{settings.hours}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p>
              Контактный телефон, электронная почта, адрес и часы работы
              продавца пока не предоставлены. Сейчас заказы и обращения через
              сайт не принимаются.
            </p>
          )}
        </section>
        <section className="info-panel">
          <h2 className="serif">Открыто и понятно</h2>
          <p>
            На сайте нет вымышленных отзывов, адресов и гарантий. До
            коммерческого запуска будут опубликованы проверенные данные
            продавца, условия продажи и необходимые документы.
          </p>
        </section>
        <section className="info-panel">
          <h2 className="serif">Пока можно вдохновляться</h2>
          <p>
            Присмотритесь к хвойным, кустарникам и цветущим растениям.
            Сохранённая корзина останется в этом браузере, если доступно
            локальное хранилище.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link href="/catalog">Посмотреть растения</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}

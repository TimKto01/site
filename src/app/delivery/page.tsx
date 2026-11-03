import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Доставка и оплата" };
export default function DeliveryPage() {
  return (
    <div className="container">
      <nav className="breadcrumb" aria-label="Хлебные крошки">
        <Link href="/">Главная</Link>
        <span>/</span>
        <span>Доставка и оплата</span>
      </nav>
      <div className="page-heading">
        <p className="eyebrow mb-3">С ЗАБОТОЙ О ЖИВОМ</p>
        <h1 className="serif">От сада к саду</h1>
        <p>
          Живым растениям нужно особое внимание в пути. Здесь будут условия
          доставки и оплаты после подключения магазина к реальным продажам.
        </p>
      </div>
      <p className="notice mb-8">
        Сейчас действует демонстрационный режим. Сайт не создаёт заказы, не
        принимает оплату и не оформляет отправления.
      </p>
      <div className="info-grid">
        <section className="info-panel">
          <h2 className="serif">Доставка растений</h2>
          <p>
            Стоимость, направления и сроки ещё не определены. Возможность
            перевозки будет зависеть от растения, упаковки, сезона и правил
            конкретной службы. Мы не утверждаем, что любой перевозчик принимает
            любые живые растения.
          </p>
        </section>
        <section className="info-panel">
          <h2 className="serif">Оплата</h2>
          <p>
            Платёжный сервис пока не подключён. Сейчас никакие данные банковских
            карт не запрашиваются и деньги не списываются. Доступные способы и
            окончательная сумма будут показаны до подтверждения будущего заказа.
          </p>
        </section>
        <section className="info-panel">
          <h2 className="serif">Условия перед отправкой</h2>
          <p>
            Для каждого растения будут учитываться вес, размер упаковки,
            допустимые способы и сезонные ограничения. Если отправка требует
            согласования, это будет явно обозначено до оформления заказа.
          </p>
        </section>
        <section className="info-panel">
          <h2 className="serif">Что дальше</h2>
          <p>
            Расчёт доставки, выбор пункта выдачи, отслеживание и оплата появятся
            на последующих этапах разработки. Пока вы можете выбрать растения и
            сохранить их в демонстрационной корзине.
          </p>
          <Link href="/catalog" className="text-link mt-5">
            Вернуться в каталог →
          </Link>
        </section>
      </div>
    </div>
  );
}

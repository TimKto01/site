import type { Metadata } from "next";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import "./globals.css";
import { catalogRepository } from "@/server/catalog";
import { getSettings } from "@/server/settings";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: {
      default: `${settings.name} — растения для вашего сада`,
      template: `%s · ${settings.name}`,
    },
    description:
      "Магазин растений: хвойные, кустарники и цветущие растения. Витрина в разработке, заказы пока не принимаются.",
    robots: { index: false, follow: false },
  };
}
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [categories, settings] = await Promise.all([
    catalogRepository.categories(),
    getSettings(),
  ]);
  return (
    <html lang="ru">
      <body>
        <a href="#main" className="skip-link">
          К содержимому
        </a>
        <Header
          categories={categories}
          name={settings.name}
          logo={settings.logo}
        />
        <main id="main">{children}</main>
        <Footer name={settings.name} />
      </body>
    </html>
  );
}

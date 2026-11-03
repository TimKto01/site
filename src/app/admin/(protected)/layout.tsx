import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/server/auth";
import { LogoutButton } from "@/components/admin/forms";
export const metadata = {
  title: "Управление магазином",
  robots: { index: false, follow: false },
};
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentAdmin();
  if (!user) redirect("/admin/login");
  return (
    <div className="container admin-shell">
      <div className="admin-top">
        <div>
          <p className="eyebrow">GREENSTORE / АДМИНИСТРАТОР</p>
          <p className="mt-2 text-xs text-secondary">{user.username}</p>
        </div>
        <LogoutButton />
      </div>
      <nav aria-label="Управление магазином" className="admin-nav">
        <Link href="/admin">Обзор</Link>
        <Link href="/admin/products">Товары</Link>
        <Link href="/admin/categories">Категории</Link>
        <Link href="/admin/settings">Настройки</Link>
        <Link href="/catalog">Открыть витрину ↗</Link>
      </nav>
      {children}
    </div>
  );
}

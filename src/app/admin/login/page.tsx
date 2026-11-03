import { redirect } from "next/navigation";
import { currentAdmin } from "@/server/auth";
import { LoginForm } from "@/components/admin/forms";
export const metadata = {
  title: "Вход администратора",
  robots: { index: false, follow: false },
};
export default async function LoginPage() {
  if (await currentAdmin()) redirect("/admin");
  return (
    <div className="container py-12">
      <section className="admin-login">
        <p className="eyebrow">GREENSTORE / УПРАВЛЕНИЕ</p>
        <h1 className="serif my-6 text-4xl">Вход администратора</h1>
        <p className="mb-7 text-sm text-secondary">
          Вход только для сотрудников магазина.
        </p>
        <LoginForm />
      </section>
    </div>
  );
}

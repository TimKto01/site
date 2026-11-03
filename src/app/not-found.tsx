import Link from "next/link";
import { Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <div className="container py-20">
      <Sprout size={44} strokeWidth={1} />
      <p className="eyebrow mt-5">404 · СВЕРНУЛИ С ТРОПИНКИ</p>
      <h1 className="serif mt-5 text-4xl">Здесь пока ничего не растёт</h1>
      <p className="my-6 text-sm text-secondary">
        Страница или растение не найдены. Всё самое зелёное — в каталоге.
      </p>
      <Button asChild>
        <Link href="/catalog">Вернуться в каталог</Link>
      </Button>
    </div>
  );
}

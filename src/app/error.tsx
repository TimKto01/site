"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container py-20">
      <p className="eyebrow">ЧТО-ТО ПОШЛО НЕ ТАК</p>
      <h1 className="serif mt-5 text-4xl">Не получилось открыть страницу</h1>
      <p className="my-6 text-sm text-secondary">
        Попробуйте ещё раз или вернитесь в каталог.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset}>Попробовать снова</Button>
        <Button asChild variant="outline">
          <Link href="/catalog">В каталог</Link>
        </Button>
      </div>
    </div>
  );
}

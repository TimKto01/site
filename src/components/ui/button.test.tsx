import Link from "next/link";
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Button } from "./button";
test("disabled action is not interactive", () => {
  render(<Button disabled>Недоступно</Button>);
  expect(screen.getByRole("button", { name: "Недоступно" })).toBeDisabled();
});
test("navigation button renders a real link", () => {
  render(
    <Button asChild>
      <Link href="/catalog">Каталог</Link>
    </Button>,
  );
  expect(screen.getByRole("link", { name: "Каталог" })).toHaveAttribute(
    "href",
    "/catalog",
  );
});

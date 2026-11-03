import { expect, test } from "vitest";
import { formatMoney } from "./utils";
test("money formatting preserves kopecks without adding decimals to whole rubles", () => {
  expect(formatMoney(123456)).toContain("1 234,56");
  expect(formatMoney(29)).toContain("0,29");
  expect(formatMoney(95000)).not.toContain(",00");
});

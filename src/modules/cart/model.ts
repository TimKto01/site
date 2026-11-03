import { z } from "zod";
export const CART_KEY = "greenstore.cart.v1";
export type CartLine = { variantId: string; quantity: number };
export const linesSchema = z
  .array(
    z.object({
      variantId: z.string().min(1).max(120),
      quantity: z.number().int().min(1).max(99),
    }),
  )
  .max(100);
const storedCart = z.object({ version: z.literal(1), lines: linesSchema });
export function sanitizeLines(lines: CartLine[]): CartLine[] {
  const result = new Map<string, number>();
  for (const line of lines) {
    if (
      !line.variantId ||
      line.variantId.length > 120 ||
      !Number.isSafeInteger(line.quantity) ||
      line.quantity < 1
    )
      continue;
    result.set(
      line.variantId,
      Math.min((result.get(line.variantId) ?? 0) + line.quantity, 99),
    );
    if (result.size >= 100) break;
  }
  return Array.from(result, ([variantId, quantity]) => ({
    variantId,
    quantity,
  }));
}
export function readCart(raw: string | null): CartLine[] {
  try {
    const parsed = storedCart.safeParse(JSON.parse(raw ?? "null"));
    return parsed.success ? sanitizeLines(parsed.data.lines) : [];
  } catch {
    return [];
  }
}
export function serializeCart(lines: CartLine[]) {
  return JSON.stringify({ version: 1, lines: sanitizeLines(lines) });
}
export function addLine(
  lines: CartLine[],
  variantId: string,
  quantity: number,
) {
  return sanitizeLines([...lines, { variantId, quantity }]);
}

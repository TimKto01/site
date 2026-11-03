import { api, jsonBody } from "@/server/http";
import { linesSchema } from "@/modules/cart/model";
import { resolveCart } from "@/server/catalog";
export async function POST(request: Request) {
  return api(async () => {
    const lines = linesSchema.parse(await jsonBody(request));
    return { products: await resolveCart(lines.map((line) => line.variantId)) };
  });
}

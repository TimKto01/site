import { adminApi, jsonBody } from "@/server/http";
import { archiveProduct, saveProduct } from "@/server/admin-catalog";
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, context: Context) {
  return adminApi(request, async (user) =>
    saveProduct(await jsonBody(request), user.id, (await context.params).id),
  );
}
export async function DELETE(request: Request, context: Context) {
  return adminApi(request, async (user) =>
    archiveProduct((await context.params).id, user.id),
  );
}

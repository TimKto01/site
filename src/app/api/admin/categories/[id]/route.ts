import { adminApi, jsonBody } from "@/server/http";
import { deleteCategory, saveCategory } from "@/server/admin-catalog";
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, context: Context) {
  return adminApi(request, async (user) =>
    saveCategory(await jsonBody(request), user.id, (await context.params).id),
  );
}
export async function DELETE(request: Request, context: Context) {
  return adminApi(request, async (user) =>
    deleteCategory((await context.params).id, user.id),
  );
}

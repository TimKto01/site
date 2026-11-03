import { adminApi, jsonBody } from "@/server/http";
import { saveCategory } from "@/server/admin-catalog";
export async function POST(request: Request) {
  return adminApi(
    request,
    async (user) => saveCategory(await jsonBody(request), user.id),
    201,
  );
}

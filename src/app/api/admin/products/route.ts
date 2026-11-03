import { adminApi, jsonBody } from "@/server/http";
import { saveProduct } from "@/server/admin-catalog";
export async function POST(request: Request) {
  return adminApi(
    request,
    async (user) => saveProduct(await jsonBody(request), user.id),
    201,
  );
}

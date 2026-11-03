import { adminApi, jsonBody } from "@/server/http";
import { saveSettings } from "@/server/admin-catalog";
export async function PUT(request: Request) {
  return adminApi(request, async (user) =>
    saveSettings(await jsonBody(request), user.id),
  );
}

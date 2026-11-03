import { adminApi } from "@/server/http";
import { logout } from "@/server/auth";
export async function POST(request: Request) {
  return adminApi(request, async () => {
    await logout(request);
    return { ok: true };
  });
}

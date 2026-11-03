import { api, jsonBody, verifyOrigin } from "@/server/http";
import { login } from "@/server/auth";
import { loginSchema } from "@/modules/admin/schemas";
export async function POST(request: Request) {
  return api(async () => {
    verifyOrigin(request);
    const data = loginSchema.parse(await jsonBody(request));
    await login(request, data.username, data.password);
    return { ok: true };
  });
}

import "server-only";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "./auth";
import { HttpError } from "./errors";
export function verifyOrigin(request: Request) {
  const origin = request.headers.get("origin");
  try {
    if (!origin || new URL(origin).host !== request.headers.get("host"))
      throw new Error();
    if (
      process.env.APP_URL &&
      new URL(origin).origin !== new URL(process.env.APP_URL).origin
    )
      throw new Error();
  } catch {
    throw new HttpError(403, "Запрос с другого сайта запрещён");
  }
}
export async function boundedBody(request: Request, limit: number) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit)
    throw new HttpError(413, "Файл или запрос слишком большой");
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  let total = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new HttpError(413, "Файл или запрос слишком большой");
    }
    chunks.push(value);
  }
  return new Uint8Array(Buffer.concat(chunks));
}
export async function jsonBody(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "Ожидается JSON");
  try {
    return JSON.parse(
      new TextDecoder().decode(await boundedBody(request, 128 * 1024)),
    ) as unknown;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "Некорректный JSON");
  }
}
export async function api(handler: () => Promise<unknown>, status = 200) {
  try {
    return Response.json(await handler(), {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    let code = 500;
    let message = "Не удалось выполнить действие. Попробуйте позже.";
    if (error instanceof HttpError) {
      code = error.status;
      message = error.message;
    } else if (error instanceof z.ZodError) {
      code = 422;
      message = error.issues[0]?.message ?? "Проверьте введённые данные";
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        code = 409;
        message = "Такой адрес, артикул или логин уже используется";
      }
      if (error.code === "P2003") {
        code = 409;
        message = "Запись связана с другими данными и не может быть удалена";
      }
      if (error.code === "P2025") {
        code = 404;
        message = "Запись не найдена";
      }
      if (error.code === "P2034") {
        code = 409;
        message =
          "Данные одновременно изменились. Обновите страницу и повторите действие.";
      }
    }
    if (code === 500)
      console.error(
        "API operation failed",
        error instanceof Error ? error.name : "UnknownError",
      );
    return Response.json(
      { error: message },
      {
        status: code,
        headers: {
          "Cache-Control": "no-store",
          ...(code === 429 ? { "Retry-After": "900" } : {}),
        },
      },
    );
  }
}
export async function adminApi(
  request: Request,
  handler: (user: { id: string; username: string }) => Promise<unknown>,
  status = 200,
) {
  return api(async () => {
    const user = await requireAdmin();
    if (!["GET", "HEAD"].includes(request.method)) verifyOrigin(request);
    return handler(user);
  }, status);
}

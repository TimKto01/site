import { adminApi, boundedBody } from "@/server/http";
import { takeRateLimit } from "@/server/auth";
import { MAX_IMAGE_BYTES, storeImage } from "@/server/storage";
import { HttpError } from "@/server/errors";
export async function POST(request: Request) {
  return adminApi(
    request,
    async (user) => {
      await takeRateLimit(`uploads:${user.id}`, 100);
      const type = request.headers.get("content-type") ?? "";
      if (!type.startsWith("multipart/form-data;"))
        throw new HttpError(415, "Ожидается файл изображения");
      const body = await boundedBody(request, MAX_IMAGE_BYTES + 65536);
      let form: FormData;
      try {
        form = await new Response(body, {
          headers: { "Content-Type": type },
        }).formData();
      } catch {
        throw new HttpError(400, "Некорректная форма загрузки");
      }
      const file = form.get("file");
      if (!(file instanceof File))
        throw new HttpError(422, "Выберите изображение");
      return storeImage(file, user.id);
    },
    201,
  );
}

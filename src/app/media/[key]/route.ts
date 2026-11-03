import { imageStorage } from "@/server/storage";
import { HttpError } from "@/server/errors";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const data = await imageStorage.read((await params).key);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (error) {
    return new Response("Изображение не найдено", {
      status: error instanceof HttpError ? error.status : 500,
    });
  }
}

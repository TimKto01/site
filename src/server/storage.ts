import "server-only";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { HttpError } from "./errors";
import { getDb } from "./db";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export interface ImageStorage {
  put(data: Uint8Array): Promise<{ key: string; url: string }>;
  read(key: string): Promise<Uint8Array>;
  remove(key: string): Promise<void>;
}
const keyPattern = /^[a-f0-9-]{36}\.webp$/;
function localPath(key: string) {
  if (!keyPattern.test(key)) throw new HttpError(404, "Изображение не найдено");
  // Uploaded assets are runtime data, never part of the deployment bundle.
  return path.join(
    /* turbopackIgnore: true */ process.env.UPLOAD_DIR ??
      path.join(process.cwd(), "storage", "uploads"),
    key,
  );
}
export const imageStorage: ImageStorage = {
  async put(data) {
    const key = `${randomUUID()}.webp`;
    const target = localPath(key);
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await writeFile(target, data, { flag: "wx", mode: 0o600 });
    return { key, url: `/media/${key}` };
  },
  async read(key) {
    try {
      return await readFile(/* turbopackIgnore: true */ localPath(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT")
        throw new HttpError(404, "Изображение не найдено");
      throw error;
    }
  },
  async remove(key) {
    await unlink(localPath(key));
  },
};
export async function storeImage(file: File, ownerId: string) {
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES)
    throw new HttpError(
      413,
      "Изображение должно быть размером от 1 байта до 5 МБ",
    );
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new HttpError(
      415,
      "Разрешены только JPEG, PNG и WebP. SVG загружать нельзя.",
    );
  let bytes: Buffer;
  let width: number;
  let height: number;
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 20_000_000,
      animated: false,
    });
    const meta = await image.metadata();
    if (
      !["jpeg", "png", "webp"].includes(meta.format ?? "") ||
      (meta.pages ?? 1) > 1
    )
      throw new Error("Unsupported image");
    const result = await image
      .rotate()
      .resize({
        width: 2000,
        height: 2000,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
    bytes = result.data;
    width = result.info.width;
    height = result.info.height;
  } catch {
    throw new HttpError(
      422,
      "Не удалось прочитать изображение. Проверьте формат и размеры.",
    );
  }
  const saved = await imageStorage.put(bytes);
  try {
    await getDb().$transaction([
      getDb().uploadAsset.create({
        data: {
          key: saved.key,
          mime: "image/webp",
          bytes: bytes.length,
          width,
          height,
          ownerId,
        },
      }),
      getDb().auditLog.create({
        data: {
          actorId: ownerId,
          action: "IMAGE_UPLOADED",
          entityId: saved.key,
          summary: "Загружено изображение растения",
        },
      }),
    ]);
  } catch (error) {
    await imageStorage.remove(saved.key);
    throw error;
  }
  return { url: saved.url, width, height };
}

import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";

const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
function scrypt(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) =>
    scryptCallback(password, salt, 64, options, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );
}
export async function hashPassword(password: string) {
  if (password.length < 12 || password.length > 128)
    throw new Error("Password must contain 12–128 characters");
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt);
  return `scrypt$32768$8$1$${salt}$${key.toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const match = /^scrypt\$32768\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(
    encoded,
  );
  if (!match || password.length > 128) return false;
  const key = await scrypt(password, match[1]!);
  return timingSafeEqual(key, Buffer.from(match[2]!, "hex"));
}

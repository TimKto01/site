import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getDb } from "./db";
import { HttpError } from "./errors";
import { hashPassword, verifyPassword } from "./password";
export const SESSION_COOKIE = "gs_admin";
const SESSION_SECONDS = 8 * 60 * 60;
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
let dummyHash: Promise<string> | undefined;
export async function takeRateLimit(key: string, maximum: number) {
  const rows = await getDb().$queryRaw<{ count: number }[]>`
    INSERT INTO "AuthThrottle" ("key", "count", "expiresAt") VALUES (${digest(key)}, 1, NOW() + INTERVAL '15 minutes')
    ON CONFLICT ("key") DO UPDATE SET
      "count"=CASE WHEN "AuthThrottle"."expiresAt" <= NOW() THEN 1 ELSE "AuthThrottle"."count"+1 END,
      "expiresAt"=CASE WHEN "AuthThrottle"."expiresAt" <= NOW() THEN NOW() + INTERVAL '15 minutes' ELSE "AuthThrottle"."expiresAt" END
    RETURNING "count"`;
  if (rows[0]!.count > maximum)
    throw new HttpError(
      429,
      "Слишком много попыток. Повторите через 15 минут.",
    );
}
export async function currentAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await getDb().adminSession.findUnique({
    where: { tokenHash: digest(token) },
    include: { user: true },
  });
  if (
    !session ||
    session.expiresAt.getTime() <= Date.now() ||
    !session.user.active
  )
    return null;
  return { id: session.user.id, username: session.user.username };
}
export async function requireAdmin() {
  const user = await currentAdmin();
  if (!user) throw new HttpError(401, "Требуется вход администратора");
  return user;
}
function secureCookie(request: Request) {
  const host = new URL(request.url).hostname;
  return (
    new URL(request.url).protocol === "https:" ||
    (process.env.NODE_ENV === "production" &&
      !["127.0.0.1", "localhost", "[::1]"].includes(host))
  );
}
export async function login(
  request: Request,
  username: string,
  password: string,
) {
  const db = getDb();
  const normalized = username.toLowerCase();
  await takeRateLimit("login:global", 120);
  await db.authThrottle.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  await takeRateLimit(`login:user:${normalized}`, 8);
  const user = await db.adminUser.findUnique({
    where: { username: normalized },
  });
  dummyHash ??= hashPassword(randomBytes(32).toString("hex"));
  const valid = await verifyPassword(
    password,
    user?.passwordHash ?? (await dummyHash),
  );
  if (!valid || !user?.active)
    throw new HttpError(401, "Неверный логин или пароль");
  const token = randomBytes(32).toString("hex");
  await db.$transaction([
    db.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    db.adminSession.create({
      data: {
        tokenHash: digest(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000),
      },
    }),
    db.authThrottle.deleteMany({
      where: { key: digest(`login:user:${normalized}`) },
    }),
    db.auditLog.create({
      data: {
        actorId: user.id,
        action: "ADMIN_LOGIN",
        entityId: user.id,
        summary: "Вход администратора",
      },
    }),
  ]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: secureCookie(request),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}
export async function logout(request: Request) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token)
    await getDb().adminSession.deleteMany({
      where: { tokenHash: digest(token) },
    });
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: secureCookie(request),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function requireAdminPage() {
  const user = await currentAdmin();
  if (!user) redirect("/admin/login");
  return user;
}

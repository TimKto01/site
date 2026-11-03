// Shared by Next.js server modules and CLI scripts. Never import into Client Components.
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const globalDb = globalThis as unknown as { greenstoreDb?: PrismaClient };
export function getDb() {
  if (globalDb.greenstoreDb) return globalDb.greenstoreDb;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const client = new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      max: 10,
      connectionTimeoutMillis: 5000,
    }),
  });
  globalDb.greenstoreDb = client;
  return client;
}

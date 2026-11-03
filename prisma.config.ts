import "dotenv/config";
import { defineConfig } from "prisma/config";
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx scripts/seed.ts" },
  // Generation/validation work without credentials; migrations require DATABASE_URL.
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/greenstore",
  },
});

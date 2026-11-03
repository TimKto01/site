import "server-only";
import { cache } from "react";
import { getDb } from "./db";
export const getSettings = cache(async () =>
  getDb().storeSetting.findUniqueOrThrow({ where: { id: "store" } }),
);

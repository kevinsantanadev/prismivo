import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import * as schema from "./schema";

type PrismivoRuntime = typeof globalThis & {
  __PRISMIVO_ENV__?: { DB?: D1Database };
};

export function getDb() {
  const database = (globalThis as PrismivoRuntime).__PRISMIVO_ENV__?.DB;
  if (!database) {
    throw new Error(
      "The optional Cloudflare D1 compatibility database is unavailable. Configure the Supabase environment variables for the independent application runtime."
    );
  }

  return drizzle(database, { schema });
}

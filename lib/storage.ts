import type { R2Bucket } from "@cloudflare/workers-types";

type PrismivoRuntime = typeof globalThis & { __PRISMIVO_ENV__?: { BUCKET?: R2Bucket } };

/** Returns the private object-storage binding exposed only inside the Worker. */
export function getPrivateBucket(): R2Bucket {
  const bucket = (globalThis as PrismivoRuntime).__PRISMIVO_ENV__?.BUCKET;
  if (!bucket) throw new Error("Private file storage is unavailable.");
  return bucket;
}

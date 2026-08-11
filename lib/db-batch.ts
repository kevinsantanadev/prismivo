import type { BatchItem } from "drizzle-orm/batch";

/** Converts a dynamically assembled list into D1's guaranteed non-empty tuple. */
export function asD1Batch(items: BatchItem<"sqlite">[]) {
  const [first, ...rest] = items;
  if (!first) throw new Error("A D1 batch must contain at least one statement.");
  return [first, ...rest] as const;
}

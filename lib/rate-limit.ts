import { isSupabaseConfigured } from "./supabase/config";
import { createSupabaseServiceClient } from "./supabase/service-server";

export type RateLimitBucket = "auth.login" | "auth.signup" | "auth.recovery";
export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: string | null };

export async function consumeRateLimit(bucket: RateLimitBucket, subject: string): Promise<RateLimitResult> {
  if (!isSupabaseConfigured()) return { allowed: process.env.NODE_ENV !== "production", remaining: 1, resetAt: null };
  const pepper = process.env.RATE_LIMIT_PEPPER;
  if (!pepper) {
    if (process.env.NODE_ENV === "production") return { allowed: false, remaining: 0, resetAt: null };
    return { allowed: true, remaining: 1, resetAt: null };
  }

  const subjectHash = await sha256(`${pepper}:${subject.trim().toLocaleLowerCase("en-US")}`);
  let supabase;
  try {
    supabase = createSupabaseServiceClient();
  } catch {
    return { allowed: process.env.NODE_ENV !== "production", remaining: 0, resetAt: null };
  }
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    target_bucket: bucket,
    target_subject_hash: subjectHash,
  });
  if (error) return { allowed: false, remaining: 0, resetAt: null };
  const result = (data ?? {}) as Record<string, unknown>;
  return {
    allowed: result.allowed === true,
    remaining: typeof result.remaining === "number" ? result.remaining : 0,
    resetAt: typeof result.resetAt === "string" ? result.resetAt : null,
  };
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

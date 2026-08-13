import { isSupabaseConfigured } from "./supabase/config";
import { createSupabaseServerClient } from "./supabase/server";

export type RateLimitBucket = "auth.login" | "auth.signup" | "auth.recovery";
export type RateLimitResult = {
  allowed: boolean;
  status: "allowed" | "limited" | "unavailable";
  remaining: number;
  resetAt: string | null;
};

export async function consumeRateLimit(bucket: RateLimitBucket, subject: string): Promise<RateLimitResult> {
  if (!isSupabaseConfigured()) return fallbackForCurrentEnvironment();
  const pepper = process.env.RATE_LIMIT_PEPPER;
  if (!pepper) {
    return fallbackForCurrentEnvironment();
  }

  const subjectHash = await sha256(`${pepper}:${subject.trim().toLocaleLowerCase("en-US")}`);
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("consume_rate_limit", {
      target_bucket: bucket,
      target_subject_hash: subjectHash,
    });

    if (error) return unavailableResult();

    const result = (data ?? {}) as Record<string, unknown>;
    if (typeof result.allowed !== "boolean") return unavailableResult();

    return {
      allowed: result.allowed,
      status: result.allowed ? "allowed" : "limited",
      remaining: typeof result.remaining === "number" ? result.remaining : 0,
      resetAt: typeof result.resetAt === "string" ? result.resetAt : null,
    };
  } catch {
    return unavailableResult();
  }
}

function fallbackForCurrentEnvironment(): RateLimitResult {
  if (process.env.NODE_ENV === "production") return unavailableResult();
  return { allowed: true, status: "allowed", remaining: 1, resetAt: null };
}

function unavailableResult(): RateLimitResult {
  return { allowed: false, status: "unavailable", remaining: 0, resetAt: null };
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

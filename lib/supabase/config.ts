const SUPABASE_URL_KEY = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_PUBLISHABLE_KEY = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env[SUPABASE_URL_KEY]?.trim() &&
      process.env[SUPABASE_PUBLISHABLE_KEY]?.trim(),
  );
}

export function getSupabasePublicConfig() {
  const url = process.env[SUPABASE_URL_KEY]?.trim();
  const publishableKey = process.env[SUPABASE_PUBLISHABLE_KEY]?.trim();

  if (!url || !publishableKey) {
    throw new Error("Independent authentication is not configured in this environment.");
  }

  return { url, publishableKey };
}

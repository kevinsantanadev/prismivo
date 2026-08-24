import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signInPath } from "@/lib/auth-paths";

export { safeReturnPath, signInPath, signOutPath } from "@/lib/auth-paths";

export type SessionUser = {
  id: string | null;
  displayName: string;
  email: string;
  fullName: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  if (error || !user?.email) return null;

  const metadataName = typeof user.user_metadata?.full_name === "string"
    ? user.user_metadata.full_name.trim()
    : "";

  return {
    id: user.id,
    displayName: metadataName || user.email,
    email: user.email,
    fullName: metadataName || null,
  };
}

export async function requireSessionUser(returnTo: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (user) return user;
  redirect(signInPath(returnTo));
}

import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeReturnPath } from "@/app/session-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedOtpTypes: EmailOtpType[] = ["email", "signup", "invite", "magiclink", "recovery", "email_change"];

/** Exchanges a single-use Supabase Auth token hash for a secure session. */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const rawType = request.nextUrl.searchParams.get("type");
  const type = allowedOtpTypes.find((candidate) => candidate === rawType);
  const next = safeReturnPath(request.nextUrl.searchParams.get("next"), "/app/onboarding");

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(next, request.nextUrl.origin));
  }

  return NextResponse.redirect(new URL("/entrar?erro=confirmacao", request.nextUrl.origin));
}

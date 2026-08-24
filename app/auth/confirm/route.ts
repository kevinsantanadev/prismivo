import { NextResponse } from "next/server";
import {
  confirmationDestination,
  parseEmailOtpType,
} from "@/lib/auth-confirmation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = parseEmailOtpType(url.searchParams.get("type"));

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    if (!error) {
      const destination = confirmationDestination(
        url.searchParams.get("next"),
        url.origin,
        type,
      );
      return NextResponse.redirect(new URL(destination, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/entrar?erro=confirmacao", url.origin));
}

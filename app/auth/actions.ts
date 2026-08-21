"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { safeReturnPath } from "@/app/session-auth";
import { authActionCopy } from "@/lib/auth-i18n";
import { consumeRateLimit } from "@/lib/rate-limit";
import { normalizeSiteLocale } from "@/lib/site-locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/app/auth/state";

const emailSchema = z.string().trim().email().max(254);
const passwordSchema = z.string().min(10).max(128);

export async function loginAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const copy = authActionCopy[authLocale(formData)];
  const parsed = z.object({
    email: emailSchema,
    password: z.string().min(1).max(128),
    returnTo: z.string().optional(),
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) return authError(copy.invalidLogin);
  const rateLimit = await consumeRateLimit("auth.login", await rateLimitSubject(parsed.data.email));
  if (!rateLimit.allowed) return authError(rateLimit.status === "limited" ? copy.rateLimit : copy.rateLimitUnavailable);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
  });

  if (error) return authError(copy.invalidCredentials);
  redirect(safeReturnPath(parsed.data.returnTo, "/app"));
}

export async function signupAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const copy = authActionCopy[authLocale(formData)];
  const values = Object.fromEntries(formData);
  const parsed = z.object({
    name: z.string().trim().min(2).max(100),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  }).refine((value) => value.password === value.confirmPassword, {
    message: copy.passwordsMismatch,
    path: ["confirmPassword"],
  }).safeParse(values);

  if (!parsed.success) {
    return authError(parsed.error.issues[0]?.message ?? copy.invalidData);
  }
  const rateLimit = await consumeRateLimit("auth.signup", await rateLimitSubject(parsed.data.email));
  if (!rateLimit.allowed) return authError(rateLimit.status === "limited" ? copy.rateLimit : copy.rateLimitUnavailable);

  const supabase = await createSupabaseServerClient();
  const origin = await requestOrigin();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
      emailRedirectTo: `${origin}/auth/callback?next=/app/onboarding`,
    },
  });

  if (error) return authError(isEmailDeliveryError(error) ? copy.signupEmailUnavailable : copy.signupFailed);

  return {
    status: "success",
    message: copy.signupSuccess,
  };
}

export async function recoveryAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const copy = authActionCopy[authLocale(formData)];
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return authError(copy.invalidEmail);
  const rateLimit = await consumeRateLimit("auth.recovery", await rateLimitSubject(parsed.data));
  if (!rateLimit.allowed) return authError(rateLimit.status === "limited" ? copy.rateLimit : copy.rateLimitUnavailable);

  const origin = await requestOrigin();
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.toLowerCase(), {
    redirectTo: `${origin}/auth/callback?next=/redefinir-senha`,
  });

  return {
    status: "success",
    message: copy.recoverySuccess,
  };
}

export async function resendConfirmationAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const copy = authActionCopy[authLocale(formData)];
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return authError(copy.invalidEmail);

  const rateLimit = await consumeRateLimit("auth.signup", await rateLimitSubject(parsed.data));
  if (!rateLimit.allowed) return authError(rateLimit.status === "limited" ? copy.rateLimit : copy.rateLimitUnavailable);

  const origin = await requestOrigin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.toLowerCase(),
    options: { emailRedirectTo: `${origin}/auth/callback?next=/app/onboarding` },
  });

  if (error && isEmailDeliveryError(error)) return authError(copy.signupEmailUnavailable);
  return { status: "success", message: copy.resendSuccess };
}

export async function updatePasswordAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const copy = authActionCopy[authLocale(formData)];
  const parsed = z.object({
    password: passwordSchema,
    confirmPassword: z.string(),
  }).refine((value) => value.password === value.confirmPassword, {
    message: copy.passwordsMismatch,
    path: ["confirmPassword"],
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return authError(parsed.error.issues[0]?.message ?? copy.invalidPassword);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return authError(copy.resetExpired);

  return { status: "success", message: copy.resetSuccess };
}

function authError(message: string): AuthActionState {
  return { status: "error", message };
}

function authLocale(formData: FormData) {
  return normalizeSiteLocale(formData.get("locale"));
}

async function requestOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

async function rateLimitSubject(email: string) {
  const requestHeaders = await headers();
  const address = requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    || requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
    || requestHeaders.get("x-real-ip")?.trim()
    || "unknown";
  return `${email.toLowerCase()}|${address}`;
}

function isEmailDeliveryError(error: { code?: string; message?: string }) {
  const signature = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  return signature.includes("email_address_not_authorized")
    || signature.includes("email_rate_limit")
    || signature.includes("over_email_send_rate_limit")
    || signature.includes("smtp");
}

"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { safeReturnPath } from "@/app/session-auth";
import { authActionCopy, passwordPolicyCopy } from "@/lib/auth-i18n";
import { classifySignupError, createPasswordSchema } from "@/lib/auth-password";
import { consumeRateLimit } from "@/lib/rate-limit";
import { normalizeSiteLocale } from "@/lib/site-locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/app/auth/state";

const emailSchema = z.string().trim().email().max(254);

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
  const locale = authLocale(formData);
  const copy = authActionCopy[locale];
  const passwordSchema = createPasswordSchema(passwordPolicyCopy[locale]);
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
      emailRedirectTo: `${origin}/app/onboarding`,
    },
  });

  if (error) {
    const failure = classifySignupError(error);
    if (failure === "weak-password") return authError(copy.passwordRequirements);
    if (failure === "rate-limit") return authError(copy.rateLimit);
    return authError(failure === "email-unavailable" ? copy.signupEmailUnavailable : copy.signupFailed);
  }

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
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.toLowerCase(), {
    redirectTo: `${origin}/redefinir-senha`,
  });

  if (error) {
    const failure = classifySignupError(error);
    if (failure === "rate-limit") return authError(copy.rateLimit);
    if (failure === "email-unavailable") return authError(copy.signupEmailUnavailable);
    return authError(copy.emailSendFailed);
  }

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
    options: { emailRedirectTo: `${origin}/app/onboarding` },
  });

  if (error) {
    const failure = classifySignupError(error);
    if (failure === "email-unavailable") return authError(copy.signupEmailUnavailable);
    if (failure === "rate-limit") return authError(copy.rateLimit);
    return authError(copy.emailSendFailed);
  }
  return { status: "success", message: copy.resendSuccess };
}

export async function updatePasswordAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const locale = authLocale(formData);
  const copy = authActionCopy[locale];
  const passwordSchema = createPasswordSchema(passwordPolicyCopy[locale]);
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

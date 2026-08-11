"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { safeReturnPath } from "@/app/session-auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/app/auth/state";

const emailSchema = z.string().trim().email().max(254);
const passwordSchema = z.string().min(10).max(128);

export async function loginAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = z.object({
    email: emailSchema,
    password: z.string().min(1).max(128),
    returnTo: z.string().optional(),
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) return authError("Revise o e-mail e a senha informados.");
  const rateLimit = await consumeRateLimit("auth.login", await rateLimitSubject(parsed.data.email));
  if (!rateLimit.allowed) return authError("Muitas tentativas em sequência. Aguarde alguns minutos e tente novamente.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
  });

  if (error) return authError("Não foi possível entrar com essas credenciais.");
  redirect(safeReturnPath(parsed.data.returnTo, "/app"));
}

export async function signupAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const values = Object.fromEntries(formData);
  const parsed = z.object({
    name: z.string().trim().min(2).max(100),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  }).refine((value) => value.password === value.confirmPassword, {
    message: "As senhas devem ser iguais.",
    path: ["confirmPassword"],
  }).safeParse(values);

  if (!parsed.success) {
    return authError(parsed.error.issues[0]?.message ?? "Revise os dados informados.");
  }
  const rateLimit = await consumeRateLimit("auth.signup", await rateLimitSubject(parsed.data.email));
  if (!rateLimit.allowed) return authError("Muitas tentativas em sequência. Aguarde alguns minutos e tente novamente.");

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

  if (error) {
    return authError("Não foi possível concluir o cadastro. Revise os dados e tente novamente.");
  }

  return {
    status: "success",
    message: "Cadastro recebido. Confira seu e-mail para confirmar a conta e continuar.",
  };
}

export async function recoveryAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return authError("Informe um e-mail válido.");
  const rateLimit = await consumeRateLimit("auth.recovery", await rateLimitSubject(parsed.data));
  if (!rateLimit.allowed) return authError("Muitas tentativas em sequência. Aguarde alguns minutos e tente novamente.");

  const origin = await requestOrigin();
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.toLowerCase(), {
    redirectTo: `${origin}/auth/callback?next=/redefinir-senha`,
  });

  return {
    status: "success",
    message: "Se existir uma conta válida para esse e-mail, enviaremos as instruções de recuperação.",
  };
}

export async function updatePasswordAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = z.object({
    password: passwordSchema,
    confirmPassword: z.string(),
  }).refine((value) => value.password === value.confirmPassword, {
    message: "As senhas devem ser iguais.",
    path: ["confirmPassword"],
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return authError(parsed.error.issues[0]?.message ?? "Revise a nova senha.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return authError("O link expirou ou a sessão não pôde ser validada. Solicite uma nova recuperação.");

  return { status: "success", message: "Senha alterada com segurança. Você já pode entrar." };
}

function authError(message: string): AuthActionState {
  return { status: "error", message };
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

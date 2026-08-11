"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import {
  loginAction,
  recoveryAction,
  signupAction,
  updatePasswordAction,
} from "@/app/auth/actions";
import { initialAuthState } from "@/app/auth/state";

type AuthMode = "login" | "signup" | "recover" | "reset";

const actions = {
  login: loginAction,
  signup: signupAction,
  recover: recoveryAction,
  reset: updatePasswordAction,
};

export function AuthForm({ mode, returnTo }: { mode: AuthMode; returnTo?: string }) {
  const [state, formAction] = useActionState(actions[mode], initialAuthState);
  const isSignup = mode === "signup";
  const asksEmail = mode !== "reset";
  const asksPassword = mode === "login" || mode === "signup" || mode === "reset";

  return (
    <form className="auth-form" action={formAction} noValidate>
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      {isSignup && (
        <div className="form-field">
          <label htmlFor="auth-name">Nome completo</label>
          <input id="auth-name" name="name" autoComplete="name" minLength={2} maxLength={100} required />
        </div>
      )}
      {asksEmail && (
        <div className="form-field">
          <label htmlFor="auth-email">E-mail</label>
          <input id="auth-email" name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} required />
        </div>
      )}
      {asksPassword && (
        <div className="form-field">
          <label htmlFor="auth-password">{mode === "reset" ? "Nova senha" : "Senha"}</label>
          <input id="auth-password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 1 : 10} maxLength={128} required />
          {mode !== "login" && <small>Use pelo menos 10 caracteres.</small>}
        </div>
      )}
      {mode === "login" && (
        <Link className="auth-help-link" href="/recuperar-senha">Esqueci minha senha</Link>
      )}
      {(isSignup || mode === "reset") && (
        <div className="form-field">
          <label htmlFor="auth-confirm-password">Confirmar senha</label>
          <input id="auth-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={10} maxLength={128} required />
        </div>
      )}

      {state.message && (
        <div className={`auth-message ${state.status}`} role={state.status === "error" ? "alert" : "status"}>
          {state.message}
        </div>
      )}

      <SubmitButton label={submitLabel(mode)} />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="button access-primary" type="submit" disabled={pending}>
      {pending ? <><LoaderCircle className="spin" aria-hidden="true" />Aguarde…</> : <>{label}<ArrowRight aria-hidden="true" /></>}
    </button>
  );
}

function submitLabel(mode: AuthMode) {
  if (mode === "signup") return "Criar conta gratuita";
  if (mode === "recover") return "Enviar instruções";
  if (mode === "reset") return "Salvar nova senha";
  return "Entrar";
}

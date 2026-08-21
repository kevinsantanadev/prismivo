"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import {
  loginAction,
  recoveryAction,
  resendConfirmationAction,
  signupAction,
  updatePasswordAction,
} from "@/app/auth/actions";
import { initialAuthState } from "@/app/auth/state";
import { authFormCopy, type AuthMode } from "@/lib/auth-i18n";
import type { SiteLocale } from "@/lib/site-locale";

const actions = {
  login: loginAction,
  signup: signupAction,
  recover: recoveryAction,
  resend: resendConfirmationAction,
  reset: updatePasswordAction,
};

export function AuthForm({ mode, locale, returnTo }: { mode: AuthMode; locale: SiteLocale; returnTo?: string }) {
  const [state, formAction] = useActionState(actions[mode], initialAuthState);
  const copy = authFormCopy[locale];
  const isSignup = mode === "signup";
  const asksEmail = mode !== "reset";
  const asksPassword = mode === "login" || mode === "signup" || mode === "reset";

  return (
    <form className="auth-form" action={formAction} noValidate>
      <input type="hidden" name="locale" value={locale} />
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      {isSignup && (
        <div className="form-field">
          <label htmlFor="auth-name">{copy.fullName}</label>
          <input id="auth-name" name="name" autoComplete="name" minLength={2} maxLength={100} required />
        </div>
      )}
      {asksEmail && (
        <div className="form-field">
          <label htmlFor="auth-email">{copy.email}</label>
          <input id="auth-email" name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} required />
        </div>
      )}
      {asksPassword && (
        <div className="form-field">
          <label htmlFor="auth-password">{mode === "reset" ? copy.newPassword : copy.password}</label>
          <input id="auth-password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 1 : 10} maxLength={128} required />
          {mode !== "login" && <small>{copy.passwordHint}</small>}
        </div>
      )}
      {mode === "login" && (
        <Link className="auth-help-link" href="/recuperar-senha">{copy.forgotPassword}</Link>
      )}
      {(isSignup || mode === "reset") && (
        <div className="form-field">
          <label htmlFor="auth-confirm-password">{copy.confirmPassword}</label>
          <input id="auth-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={10} maxLength={128} required />
        </div>
      )}

      {state.message && (
        <div className={`auth-message ${state.status}`} role={state.status === "error" ? "alert" : "status"}>
          {state.message}
        </div>
      )}

      {mode === "signup" && state.status === "success" && (
        <Link className="auth-help-link" href="/reenviar-confirmacao">{copy.resendConfirmation}</Link>
      )}

      <SubmitButton label={copy[mode]} pendingLabel={copy.pending} />
    </form>
  );
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="button access-primary" type="submit" disabled={pending}>
      {pending ? <><LoaderCircle className="spin" aria-hidden="true" />{pendingLabel}</> : <>{label}<ArrowRight aria-hidden="true" /></>}
    </button>
  );
}

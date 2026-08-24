"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  MailCheck,
} from "lucide-react";
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
import {
  evaluatePasswordRequirements,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/auth-password";
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
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const copy = authFormCopy[locale];
  const isSignup = mode === "signup";
  const asksEmail = mode !== "reset";
  const asksPassword = mode === "login" || mode === "signup" || mode === "reset";
  const usesNewPassword = isSignup || mode === "reset";
  const requirements = evaluatePasswordRequirements(password);
  const passwordScore = Object.values(requirements).filter(Boolean).length;
  const passwordStrength = passwordScore === 0
    ? copy.passwordStrengthEmpty
    : passwordScore <= 2
      ? copy.passwordStrengthWeak
      : passwordScore <= 4
        ? copy.passwordStrengthProgress
        : copy.passwordStrengthStrong;

  return (
    <form className="auth-form" action={formAction} noValidate>
      <input type="hidden" name="locale" value={locale} />
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

      {isSignup && (
        <div className="form-field">
          <label htmlFor="auth-name">{copy.fullName}</label>
          <input
            id="auth-name"
            name="name"
            autoComplete="name"
            minLength={2}
            maxLength={100}
            placeholder={copy.fullNamePlaceholder}
            required
          />
        </div>
      )}

      {asksEmail && (
        <div className="form-field">
          <label htmlFor="auth-email">{copy.email}</label>
          <input
            id="auth-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={254}
            placeholder={copy.emailPlaceholder}
            required
          />
        </div>
      )}

      {asksPassword && (
        <PasswordField
          id="auth-password"
          label={mode === "reset" ? copy.newPassword : copy.password}
          name="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "login" ? 1 : PASSWORD_MIN_LENGTH}
          value={password}
          onChange={setPassword}
          describedBy={usesNewPassword ? "auth-password-requirements" : undefined}
          showLabel={copy.showPassword}
          hideLabel={copy.hidePassword}
        />
      )}

      {usesNewPassword && (
        <div
          id="auth-password-requirements"
          className="password-strength"
          data-score={passwordScore}
          role="status"
          aria-live="polite"
        >
          <div className="password-strength-heading">
            <span>{copy.passwordSecurity}</span>
            <strong>{passwordStrength}</strong>
          </div>
          <div className="password-strength-meter" aria-hidden="true">
            {Array.from({ length: 5 }, (_, index) => (
              <span className={index < passwordScore ? "active" : undefined} key={index} />
            ))}
          </div>
          <p>{copy.passwordHint}</p>
        </div>
      )}

      {mode === "login" && (
        <Link className="auth-help-link" href="/recuperar-senha">{copy.forgotPassword}</Link>
      )}

      {usesNewPassword && (
        <PasswordField
          id="auth-confirm-password"
          label={copy.confirmPassword}
          name="confirmPassword"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          value={confirmation}
          onChange={setConfirmation}
          describedBy="auth-password-match"
          showLabel={copy.showPassword}
          hideLabel={copy.hidePassword}
        />
      )}

      {usesNewPassword && confirmation && (
        <small
          id="auth-password-match"
          className={password === confirmation ? "password-match met" : "password-match"}
          aria-live="polite"
        >
          {password === confirmation ? copy.passwordsMatch : copy.passwordsDiffer}
        </small>
      )}

      {state.message && (
        <div
          className={["auth-message", state.status].join(" ")}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.status === "success" && <MailCheck aria-hidden="true" />}
          <span>{state.message}</span>
        </div>
      )}

      {state.status === "success" && mode !== "reset" && (
        <div className="auth-delivery-help">
          <strong>{copy.deliveryTitle}</strong>
          <span>{copy.deliveryHelp}</span>
        </div>
      )}

      {state.status === "success" && (
        <div className="auth-next-steps">
          {mode !== "login" && <Link href="/entrar">{copy.signInLink}</Link>}
          {mode === "signup" && <Link href="/recuperar-senha">{copy.recoverAccess}</Link>}
          {(mode === "signup" || mode === "recover") && (
            <Link href="/reenviar-confirmacao">{copy.resendConfirmation}</Link>
          )}
        </div>
      )}

      <SubmitButton label={copy[mode]} pendingLabel={copy.pending} />
    </form>
  );
}

function PasswordField({
  id,
  label,
  name,
  autoComplete,
  minLength,
  value,
  onChange,
  describedBy,
  showLabel,
  hideLabel,
}: {
  id: string;
  label: string;
  name: string;
  autoComplete: string;
  minLength: number;
  value: string;
  onChange: (value: string) => void;
  describedBy?: string;
  showLabel: string;
  hideLabel: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input-wrap">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={PASSWORD_MAX_LENGTH}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={describedBy}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="button access-primary" type="submit" disabled={pending}>
      {pending
        ? <><LoaderCircle className="spin" aria-hidden="true" />{pendingLabel}</>
        : <>{label}<ArrowRight aria-hidden="true" /></>}
    </button>
  );
}

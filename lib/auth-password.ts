import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const ALLOWED_SPECIAL_CHARACTERS = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~";

export type PasswordPolicyMessages = {
  tooShort: string;
  tooLong: string;
  lowercase: string;
  uppercase: string;
  number: string;
  symbol: string;
};

export type PasswordRequirementStatus = {
  length: boolean;
  lowercase: boolean;
  uppercase: boolean;
  number: boolean;
  symbol: boolean;
};

export function evaluatePasswordRequirements(password: string): PasswordRequirementStatus {
  return {
    length: password.length >= PASSWORD_MIN_LENGTH,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: [...password].some((character) => ALLOWED_SPECIAL_CHARACTERS.includes(character)),
  };
}

export function createPasswordSchema(messages: PasswordPolicyMessages) {
  return z
    .string()
    .min(PASSWORD_MIN_LENGTH, messages.tooShort)
    .max(PASSWORD_MAX_LENGTH, messages.tooLong)
    .refine((password) => /[a-z]/.test(password), { message: messages.lowercase })
    .refine((password) => /[A-Z]/.test(password), { message: messages.uppercase })
    .refine((password) => /[0-9]/.test(password), { message: messages.number })
    .refine(
      (password) => [...password].some((character) => ALLOWED_SPECIAL_CHARACTERS.includes(character)),
      { message: messages.symbol },
    );
}

export type SignupErrorKind = "weak-password" | "rate-limit" | "email-unavailable" | "other";

export function classifySignupError(error: unknown): SignupErrorKind {
  if (typeof error !== "object" || error === null) return "other";

  const authError = error as { code?: string; message?: string; status?: number };
  const code = authError.code?.toLowerCase() ?? "";
  const message = authError.message?.toLowerCase() ?? "";
  const signature = `${code} ${message}`;

  if (code.includes("weak_password") || message.includes("weak password")) {
    return "weak-password";
  }

  if (code.includes("rate_limit") || authError.status === 429) {
    return "rate-limit";
  }

  if (
    code === "unexpected_failure"
    || signature.includes("email_address_not_authorized")
    || signature.includes("authentication credentials invalid")
    || signature.includes("smtp")
    || (authError.status ?? 0) >= 500
  ) {
    return "email-unavailable";
  }

  return "other";
}

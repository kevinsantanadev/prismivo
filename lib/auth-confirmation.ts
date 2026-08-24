import { safeReturnPath } from "@/app/session-auth";

export type PrismivoEmailOtpType = "email" | "recovery";

export function parseEmailOtpType(value: string | null): PrismivoEmailOtpType | null {
  return value === "email" || value === "recovery" ? value : null;
}

export function confirmationDestination(
  rawNext: string | null,
  requestOrigin: string,
  type: PrismivoEmailOtpType,
): string {
  const fallback = type === "recovery" ? "/redefinir-senha" : "/app/onboarding";
  if (!rawNext) return fallback;

  if (rawNext.startsWith("/") && !rawNext.startsWith("//")) {
    const safePath = safeReturnPath(rawNext, fallback);
    return safePath === "/" && rawNext !== "/" ? fallback : safePath;
  }

  try {
    const candidate = new URL(rawNext);
    if (candidate.origin !== requestOrigin) return fallback;
    const candidatePath = candidate.pathname + candidate.search + candidate.hash;
    const safePath = safeReturnPath(candidatePath, fallback);
    return safePath === "/" && candidate.pathname !== "/" ? fallback : safePath;
  } catch {
    return fallback;
  }
}

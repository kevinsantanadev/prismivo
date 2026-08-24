/** Browser-safe helpers for auth navigation; this module has no server dependencies. */
export function signInPath(returnTo: string): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `/entrar?returnTo=${encodeURIComponent(safeReturnTo)}`;
}

export function signOutPath(returnTo = "/"): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `/auth/signout?returnTo=${encodeURIComponent(safeReturnTo)}`;
}

export function safeReturnPath(value: string | null | undefined, fallback = "/app"): string {
  return value ? safeRelativeReturnPath(value) : fallback;
}

function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  let url: URL;
  try {
    url = new URL(value, "https://app.local");
  } catch {
    return "/";
  }
  if (url.origin !== "https://app.local") return "/";
  if (isReservedAuthPath(url.pathname)) return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}

function isReservedAuthPath(pathname: string): boolean {
  return pathname === "/auth/callback" ||
    pathname === "/auth/confirm" ||
    pathname === "/auth/signout";
}

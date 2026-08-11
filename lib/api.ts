export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = {
  ok: false;
  error: { code: string; message: string; fields?: Record<string, string> };
};

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return Response.json({ ok: true, data } satisfies ApiSuccess<T>, init);
}

export function apiError(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string>,
) {
  return Response.json(
    { ok: false, error: { code, message, fields } } satisfies ApiFailure,
    { status },
  );
}

/** Rejects cross-site form submissions before any state-changing operation. */
export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function isJsonRequest(request: Request) {
  return request.headers.get("content-type")?.startsWith("application/json") ?? false;
}


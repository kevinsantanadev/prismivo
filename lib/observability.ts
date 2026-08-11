type LogLevel = "info" | "warn" | "error";
type LogContext = Record<string, string | number | boolean | null | undefined>;

export function logServerEvent(level: LogLevel, event: string, context: LogContext = {}) {
  const safeContext = Object.fromEntries(
    Object.entries(context).filter(([key, value]) => value !== undefined && !/(password|secret|token|cookie|authorization|email)/iu.test(key)),
  );
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...safeContext,
    level,
    event,
  });
  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.info(payload);
}

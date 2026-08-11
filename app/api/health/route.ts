import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logServerEvent } from "@/lib/observability";

export const dynamic = "force-dynamic";

export async function GET() {
  const requestId = crypto.randomUUID();
  const configured = isSupabaseConfigured();
  let database: "ready" | "unconfigured" | "unreachable" = configured ? "unreachable" : "unconfigured";

  if (configured) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.from("plans").select("code", { count: "exact", head: true }).eq("active", true);
      database = error ? "unreachable" : "ready";
      if (error) logServerEvent("warn", "health.database_unreachable", { requestId, errorCode: error.code });
    } catch (error) {
      database = "unreachable";
      logServerEvent("error", "health.check_failed", { requestId, errorName: error instanceof Error ? error.name : "UnknownError" });
    }
  }

  const ready = database === "ready";
  return Response.json({
    status: ready ? "ok" : "degraded",
    service: "prismivo-web",
    timestamp: new Date().toISOString(),
    requestId,
    checks: { application: "ready", database },
  }, {
    status: ready || process.env.NODE_ENV !== "production" ? 200 : 503,
    headers: { "cache-control": "no-store, max-age=0", "x-content-type-options": "nosniff", "x-request-id": requestId },
  });
}

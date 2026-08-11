import { and, eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/app/session-auth";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { apiError, apiSuccess, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { notificationActionSchema } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { markNotificationsRead } from "@/lib/supabase/mutations";

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  if (!isJsonRequest(request)) return apiError("INVALID_CONTENT_TYPE", "Envie os dados no formato esperado.", 415);

  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);

  let payload: unknown;
  try { payload = await request.json(); } catch { return apiError("INVALID_JSON", "Dados inválidos.", 400); }
  const parsed = notificationActionSchema.safeParse(payload);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Ação de notificação inválida.", 422);

  if (isSupabaseConfigured()) {
    return supabaseMutationResponse(await markNotificationsRead(workspace, parsed.data));
  }

  const ownership = and(
    eq(notifications.userId, workspace.userId),
    eq(notifications.organizationId, workspace.organizationId),
  );
  try {
    await getDb()
      .update(notifications)
      .set({ readAt: sql`CURRENT_TIMESTAMP` })
      .where(
        parsed.data.markAll
          ? ownership
          : and(ownership, eq(notifications.id, parsed.data.notificationId!)),
      );
  } catch (error) {
    console.error("notification_update_failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return apiError("NOTIFICATION_UPDATE_FAILED", "Não foi possível atualizar as notificações.", 500);
  }
  return apiSuccess({ updated: true });
}

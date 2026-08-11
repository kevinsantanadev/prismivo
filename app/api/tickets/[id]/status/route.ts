import { and, eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/app/session-auth";
import { getDb } from "@/db";
import { activities, supportTickets } from "@/db/schema";
import { apiError, apiSuccess, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { ticketStatusSchema } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { updateTicketStatusRecord } from "@/lib/supabase/mutations";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  if (!isJsonRequest(request)) return apiError("INVALID_CONTENT_TYPE", "Envie os dados no formato esperado.", 415);
  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);
  if (!hasPermission(workspace.role, "support.write")) return apiError("FORBIDDEN", "Seu papel não permite alterar atendimentos.", 403);
  const { id } = await context.params;
  let payload: unknown;
  try { payload = await request.json(); } catch { return apiError("INVALID_JSON", "Dados inválidos.", 400); }
  const parsed = ticketStatusSchema.safeParse(payload);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Ação de atendimento inválida.", 422);
  if (isSupabaseConfigured()) {
    return supabaseMutationResponse(await updateTicketStatusRecord(workspace, id, parsed.data.action));
  }
  const db = getDb();
  const [ticket] = await db.select({ id: supportTickets.id, protocol: supportTickets.protocol }).from(supportTickets)
    .where(and(eq(supportTickets.id, id), eq(supportTickets.organizationId, workspace.organizationId))).limit(1);
  if (!ticket) return apiError("TICKET_NOT_FOUND", "Atendimento não encontrado.", 404);
  const nextStatus = parsed.data.action === "close" ? "closed" : "open";
  try {
    await db.batch([
      db.update(supportTickets).set({ status: nextStatus, closedAt: nextStatus === "closed" ? sql`CURRENT_TIMESTAMP` : null, updatedAt: sql`CURRENT_TIMESTAMP` }).where(and(eq(supportTickets.id, id), eq(supportTickets.organizationId, workspace.organizationId))),
      db.insert(activities).values({ id: `act_${crypto.randomUUID()}`, organizationId: workspace.organizationId, actorUserId: workspace.userId, type: `ticket.${nextStatus}`, title: nextStatus === "closed" ? "Atendimento encerrado" : "Atendimento reaberto", detail: ticket.protocol, resourceType: "ticket", resourceId: id }),
    ]);
  } catch (error) {
    console.error("ticket_status_failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return apiError("TICKET_STATUS_FAILED", "Não foi possível alterar o atendimento.", 500);
  }
  return apiSuccess({ id, status: nextStatus });
}

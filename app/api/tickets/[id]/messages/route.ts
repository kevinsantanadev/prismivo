import { and, eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/app/session-auth";
import { getDb } from "@/db";
import { activities, notifications, supportTickets, ticketMessages } from "@/db/schema";
import { apiError, apiSuccess, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { ticketMessageSchema, zodFieldErrors } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { addTicketMessageRecord } from "@/lib/supabase/mutations";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  if (!isJsonRequest(request)) return apiError("INVALID_CONTENT_TYPE", "Envie os dados no formato esperado.", 415);
  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);
  if (!hasPermission(workspace.role, "support.write")) return apiError("FORBIDDEN", "Seu papel não permite responder atendimentos.", 403);
  const { id } = await context.params;
  let payload: unknown;
  try { payload = await request.json(); } catch { return apiError("INVALID_JSON", "Dados inválidos.", 400); }
  const parsed = ticketMessageSchema.safeParse(payload);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Revise a mensagem.", 422, zodFieldErrors(parsed.error));
  if (isSupabaseConfigured()) {
    return supabaseMutationResponse(await addTicketMessageRecord(workspace, id, parsed.data.message), 201);
  }
  const db = getDb();
  const [ticket] = await db.select({ id: supportTickets.id, protocol: supportTickets.protocol, status: supportTickets.status }).from(supportTickets)
    .where(and(eq(supportTickets.id, id), eq(supportTickets.organizationId, workspace.organizationId))).limit(1);
  if (!ticket) return apiError("TICKET_NOT_FOUND", "Atendimento não encontrado.", 404);
  if (ticket.status === "closed") return apiError("TICKET_CLOSED", "Reabra o atendimento antes de responder.", 409);
  const messageId = `msg_${crypto.randomUUID()}`;
  try {
    await db.batch([
      db.insert(ticketMessages).values({ id: messageId, ticketId: id, organizationId: workspace.organizationId, authorUserId: workspace.userId, body: parsed.data.message }),
      db.update(supportTickets).set({ updatedAt: sql`CURRENT_TIMESTAMP` }).where(and(eq(supportTickets.id, id), eq(supportTickets.organizationId, workspace.organizationId))),
      db.insert(activities).values({ id: `act_${crypto.randomUUID()}`, organizationId: workspace.organizationId, actorUserId: workspace.userId, type: "ticket.message_added", title: "Resposta adicionada ao atendimento", detail: ticket.protocol, resourceType: "ticket", resourceId: id }),
      db.insert(notifications).values({ id: `not_${crypto.randomUUID()}`, userId: workspace.userId, organizationId: workspace.organizationId, category: "support", title: "Resposta registrada", body: `A conversa de ${ticket.protocol} foi atualizada.` }),
    ]);
  } catch (error) {
    console.error("ticket_message_failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return apiError("TICKET_MESSAGE_FAILED", "Não foi possível registrar a resposta.", 500);
  }
  return apiSuccess({ id: messageId }, { status: 201 });
}

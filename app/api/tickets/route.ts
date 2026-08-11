import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/app/session-auth";
import { getDb } from "@/db";
import { activities, clients, notifications, supportTickets, ticketMessages } from "@/db/schema";
import { apiError, apiSuccess, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { ticketSchema, zodFieldErrors } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { createTicketRecord } from "@/lib/supabase/mutations";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  if (!isJsonRequest(request)) return apiError("INVALID_CONTENT_TYPE", "Envie os dados no formato esperado.", 415);
  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);
  if (!hasPermission(workspace.role, "support.write")) return apiError("FORBIDDEN", "Seu papel não permite abrir atendimentos.", 403);
  let payload: unknown;
  try { payload = await request.json(); } catch { return apiError("INVALID_JSON", "Dados inválidos.", 400); }
  const parsed = ticketSchema.safeParse(payload);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Revise os campos destacados.", 422, zodFieldErrors(parsed.error));
  if (isSupabaseConfigured()) {
    return supabaseMutationResponse(await createTicketRecord(workspace, parsed.data), 201);
  }
  const clientId = parsed.data.clientId || null;
  const db = getDb();
  if (clientId) {
    const [ownedClient] = await db.select({ id: clients.id }).from(clients).where(and(eq(clients.id, clientId), eq(clients.organizationId, workspace.organizationId))).limit(1);
    if (!ownedClient) return apiError("CLIENT_NOT_FOUND", "Cliente não encontrado.", 404);
  }
  const ticketId = `tic_${crypto.randomUUID()}`;
  const protocol = `PRI-${new Date().getUTCFullYear()}-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
  try {
    await db.batch([
      db.insert(supportTickets).values({ id: ticketId, organizationId: workspace.organizationId, requesterUserId: workspace.userId, clientId, protocol, category: parsed.data.category, priority: parsed.data.priority, subject: parsed.data.subject }),
      db.insert(ticketMessages).values({ id: `msg_${crypto.randomUUID()}`, ticketId, organizationId: workspace.organizationId, authorUserId: workspace.userId, body: parsed.data.message }),
      db.insert(activities).values({ id: `act_${crypto.randomUUID()}`, organizationId: workspace.organizationId, actorUserId: workspace.userId, type: "ticket.created", title: "Atendimento aberto", detail: `${protocol}: ${parsed.data.subject}`, resourceType: "ticket", resourceId: ticketId }),
      db.insert(notifications).values({ id: `not_${crypto.randomUUID()}`, userId: workspace.userId, organizationId: workspace.organizationId, category: "support", title: "Solicitação registrada", body: `${protocol} foi aberto e já possui histórico.` }),
    ]);
  } catch (error) {
    console.error("ticket_create_failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return apiError("TICKET_CREATE_FAILED", "Não foi possível abrir o atendimento agora.", 500);
  }
  return apiSuccess({ id: ticketId, protocol }, { status: 201 });
}

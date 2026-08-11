import { and, eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/app/session-auth";
import { getDb } from "@/db";
import { activities, approvals, notifications } from "@/db/schema";
import { apiError, apiSuccess, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { approvalDecisionSchema, zodFieldErrors } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { decideApprovalRecord } from "@/lib/supabase/mutations";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return apiError("INVALID_ORIGIN", "Não foi possível validar a origem da solicitação.", 403);
  }
  if (!isJsonRequest(request)) {
    return apiError("INVALID_CONTENT_TYPE", "Envie os dados no formato esperado.", 415);
  }

  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);
  if (!hasPermission(workspace.role, "approvals.write")) return apiError("FORBIDDEN", "Seu papel não permite alterar aprovações.", 403);

  const { id } = await context.params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Não foi possível interpretar os dados enviados.", 400);
  }
  const parsed = approvalDecisionSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Revise a decisão informada.", 422, zodFieldErrors(parsed.error));
  }

  if (isSupabaseConfigured()) {
    return supabaseMutationResponse(await decideApprovalRecord(workspace, id, parsed.data.decision));
  }

  const db = getDb();
  const [ownedApproval] = await db
    .select({ id: approvals.id, title: approvals.title, status: approvals.status })
    .from(approvals)
    .where(and(eq(approvals.id, id), eq(approvals.organizationId, workspace.organizationId)))
    .limit(1);
  if (!ownedApproval) return apiError("APPROVAL_NOT_FOUND", "Aprovação não encontrada.", 404);
  if (ownedApproval.status !== "pending") {
    return apiError("APPROVAL_ALREADY_DECIDED", "Essa aprovação já recebeu uma decisão.", 409);
  }

  const approved = parsed.data.decision === "approved";
  try {
    await db.batch([
      db.update(approvals)
        .set({
          status: parsed.data.decision,
          decidedByUserId: workspace.userId,
          decidedAt: sql`CURRENT_TIMESTAMP`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(and(eq(approvals.id, id), eq(approvals.organizationId, workspace.organizationId))),
      db.insert(activities).values({
        id: `act_${crypto.randomUUID()}`,
        organizationId: workspace.organizationId,
        actorUserId: workspace.userId,
        type: approved ? "approval.approved" : "approval.changes_requested",
        title: approved ? "Entrega aprovada" : "Ajustes solicitados",
        detail: ownedApproval.title,
        resourceType: "approval",
        resourceId: id,
      }),
      db.insert(notifications).values({
        id: `not_${crypto.randomUUID()}`,
        userId: workspace.userId,
        organizationId: workspace.organizationId,
        category: "approval",
        title: approved ? "Aprovação concluída" : "Solicitação devolvida para ajustes",
        body: `${ownedApproval.title} teve o status atualizado.`,
      }),
    ]);
  } catch (error) {
    console.error("approval_decision_failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return apiError("APPROVAL_DECISION_FAILED", "Não foi possível registrar a decisão agora.", 500);
  }

  return apiSuccess({ id, status: parsed.data.decision });
}

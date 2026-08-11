import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/app/session-auth";
import { getDb } from "@/db";
import { activities, approvals, notifications, projects } from "@/db/schema";
import { apiError, apiSuccess, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { approvalSchema, zodFieldErrors } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { createApprovalRecord } from "@/lib/supabase/mutations";

export async function POST(request: Request) {
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

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Não foi possível interpretar os dados enviados.", 400);
  }
  const parsed = approvalSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Revise os campos destacados.", 422, zodFieldErrors(parsed.error));
  }

  if (isSupabaseConfigured()) {
    return supabaseMutationResponse(await createApprovalRecord(workspace, parsed.data), 201);
  }

  const db = getDb();
  const [ownedProject] = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(and(eq(projects.id, parsed.data.projectId), eq(projects.organizationId, workspace.organizationId)))
    .limit(1);
  if (!ownedProject) return apiError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);

  const approvalId = `apr_${crypto.randomUUID()}`;
  try {
    await db.batch([
      db.insert(approvals).values({
        id: approvalId,
        organizationId: workspace.organizationId,
        projectId: ownedProject.id,
        title: parsed.data.title,
        description: parsed.data.description,
        dueDate: parsed.data.dueDate || null,
      }),
      db.insert(activities).values({
        id: `act_${crypto.randomUUID()}`,
        organizationId: workspace.organizationId,
        actorUserId: workspace.userId,
        type: "approval.created",
        title: "Aprovação solicitada",
        detail: `${parsed.data.title} foi vinculada a ${ownedProject.name}.`,
        resourceType: "approval",
        resourceId: approvalId,
      }),
      db.insert(notifications).values({
        id: `not_${crypto.randomUUID()}`,
        userId: workspace.userId,
        organizationId: workspace.organizationId,
        category: "approval",
        title: "Nova aprovação pendente",
        body: `${parsed.data.title} aguarda uma decisão.`,
      }),
    ]);
  } catch (error) {
    console.error("approval_create_failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return apiError("APPROVAL_CREATE_FAILED", "Não foi possível criar a aprovação agora.", 500);
  }

  return apiSuccess({ id: approvalId }, { status: 201 });
}

import { and, eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/app/session-auth";
import { getDb } from "@/db";
import { activities, projects } from "@/db/schema";
import { apiError, apiSuccess, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { projectProgressSchema, zodFieldErrors } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { updateProjectProgressRecord } from "@/lib/supabase/mutations";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  if (!isJsonRequest(request)) return apiError("INVALID_CONTENT_TYPE", "Envie os dados no formato esperado.", 415);

  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);
  if (!hasPermission(workspace.role, "projects.write")) return apiError("FORBIDDEN", "Seu papel não permite alterar projetos.", 403);

  const { id } = await context.params;
  let payload: unknown;
  try { payload = await request.json(); } catch { return apiError("INVALID_JSON", "Dados inválidos.", 400); }
  const parsed = projectProgressSchema.safeParse(payload);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Revise o progresso.", 422, zodFieldErrors(parsed.error));

  if (isSupabaseConfigured()) {
    return supabaseMutationResponse(await updateProjectProgressRecord(workspace, id, parsed.data.progress));
  }

  const db = getDb();
  const [ownedProject] = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.organizationId, workspace.organizationId)))
    .limit(1);
  if (!ownedProject) return apiError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);

  try {
    await db.batch([
      db.update(projects)
        .set({
          progress: parsed.data.progress,
          status: parsed.data.progress === 100 ? "completed" : "active",
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(and(eq(projects.id, id), eq(projects.organizationId, workspace.organizationId))),
      db.insert(activities).values({
        id: `act_${crypto.randomUUID()}`,
        organizationId: workspace.organizationId,
        actorUserId: workspace.userId,
        type: "project.progress_updated",
        title: "Progresso atualizado",
        detail: `${ownedProject.name} avançou para ${parsed.data.progress}%.`,
        resourceType: "project",
        resourceId: id,
      }),
    ]);
  } catch (error) {
    console.error("project_progress_failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return apiError("PROJECT_PROGRESS_FAILED", "Não foi possível atualizar o progresso.", 500);
  }

  return apiSuccess({ id, progress: parsed.data.progress });
}

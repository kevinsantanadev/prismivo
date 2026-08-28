import { and, eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/app/session-auth";
import { getDb } from "@/db";
import { activities, projects } from "@/db/schema";
import { apiError, apiSuccess, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { asD1Batch } from "@/lib/db-batch";
import { hasPermission } from "@/lib/permissions";
import { activeProjectLimitForPlan, isActiveProjectLimitReached } from "@/lib/project-limits";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { deleteProjectRecord, updateProjectLifecycleRecord } from "@/lib/supabase/mutations";
import { projectLifecycleSchema, zodFieldErrors } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";

async function authorize() {
  const identity = await getSessionUser();
  if (!identity) return { response: apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401) };
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return { response: apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409) };
  if (!hasPermission(workspace.role, "projects.write")) return { response: apiError("FORBIDDEN", "Seu papel não permite alterar projetos.", 403) };
  return { workspace };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  if (!isJsonRequest(request)) return apiError("INVALID_CONTENT_TYPE", "Envie os dados no formato esperado.", 415);
  const authorized = await authorize();
  if ("response" in authorized) return authorized.response;
  let payload: unknown;
  try { payload = await request.json(); } catch { return apiError("INVALID_JSON", "Dados inválidos.", 400); }
  const parsed = projectLifecycleSchema.safeParse(payload);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Ação de projeto inválida.", 422, zodFieldErrors(parsed.error));
  const { id } = await context.params;
  if (isSupabaseConfigured()) return supabaseMutationResponse(await updateProjectLifecycleRecord(authorized.workspace, id, parsed.data.action));

  const db = getDb();
  const [project] = await db.select({ id: projects.id, name: projects.name, status: projects.status, progress: projects.progress })
    .from(projects).where(and(eq(projects.id, id), eq(projects.organizationId, authorized.workspace.organizationId))).limit(1);
  if (!project) return apiError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
  if (parsed.data.action === "archive" && project.status === "archived") return apiSuccess({ id, status: project.status });
  if (parsed.data.action === "restore" && project.status !== "archived") return apiSuccess({ id, status: project.status });

  if (parsed.data.action === "restore" && project.status === "archived" && project.progress < 100) {
    const [total] = await db.select({ value: sql<number>`count(*)` }).from(projects)
      .where(and(eq(projects.organizationId, authorized.workspace.organizationId), eq(projects.status, "active")));
    const limit = activeProjectLimitForPlan(authorized.workspace.plan);
    if (isActiveProjectLimitReached(Number(total?.value ?? 0), limit)) return apiError("PLAN_LIMIT_REACHED", `Seu plano permite até ${limit} projetos ativos. Arquive outro projeto ou escolha outro plano.`, 403);
  }

  const status = parsed.data.action === "archive" ? "archived" : project.progress === 100 ? "completed" : "active";
  try {
    await db.batch(asD1Batch([
      db.update(projects).set({ status, updatedAt: sql`CURRENT_TIMESTAMP` }).where(and(eq(projects.id, id), eq(projects.organizationId, authorized.workspace.organizationId))),
      db.insert(activities).values({ id: `act_${crypto.randomUUID()}`, organizationId: authorized.workspace.organizationId, actorUserId: authorized.workspace.userId, type: parsed.data.action === "archive" ? "project.archived" : "project.restored", title: parsed.data.action === "archive" ? "Projeto arquivado" : "Projeto restaurado", detail: project.name, resourceType: "project", resourceId: id }),
    ]));
  } catch (error) {
    console.error("project_lifecycle_failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return apiError("PROJECT_LIFECYCLE_FAILED", "Não foi possível alterar o projeto.", 500);
  }
  return apiSuccess({ id, status });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  const authorized = await authorize();
  if ("response" in authorized) return authorized.response;
  if (!["owner", "admin"].includes(authorized.workspace.role)) return apiError("FORBIDDEN", "Somente proprietários e administradores podem excluir projetos.", 403);
  const { id } = await context.params;
  if (isSupabaseConfigured()) return supabaseMutationResponse(await deleteProjectRecord(authorized.workspace, id));

  const db = getDb();
  const [project] = await db.select({ id: projects.id, name: projects.name, status: projects.status }).from(projects)
    .where(and(eq(projects.id, id), eq(projects.organizationId, authorized.workspace.organizationId))).limit(1);
  if (!project) return apiError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
  if (project.status !== "archived") return apiError("PROJECT_MUST_BE_ARCHIVED", "Arquive o projeto antes de excluí-lo definitivamente.", 409);
  try {
    await db.batch(asD1Batch([
      db.delete(projects).where(and(eq(projects.id, id), eq(projects.organizationId, authorized.workspace.organizationId))),
      db.insert(activities).values({ id: `act_${crypto.randomUUID()}`, organizationId: authorized.workspace.organizationId, actorUserId: authorized.workspace.userId, type: "project.deleted", title: "Projeto excluído", detail: project.name, resourceType: "project", resourceId: id }),
    ]));
  } catch (error) {
    console.error("project_delete_failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return apiError("PROJECT_DELETE_FAILED", "Não foi possível excluir o projeto.", 500);
  }
  return apiSuccess({ id, deleted: true });
}

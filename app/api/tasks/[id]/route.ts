import { and, eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/app/session-auth";
import { getDb } from "@/db";
import { activities, projects, tasks } from "@/db/schema";
import { apiError, apiSuccess, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { taskStatusSchema } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { updateTaskStatusRecord } from "@/lib/supabase/mutations";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  if (!isJsonRequest(request)) return apiError("INVALID_CONTENT_TYPE", "Envie os dados no formato esperado.", 415);
  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);
  if (!hasPermission(workspace.role, "tasks.write")) return apiError("FORBIDDEN", "Seu papel não permite alterar tarefas.", 403);
  const { id } = await context.params;
  let payload: unknown;
  try { payload = await request.json(); } catch { return apiError("INVALID_JSON", "Dados inválidos.", 400); }
  const parsed = taskStatusSchema.safeParse(payload);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Status da tarefa inválido.", 422);
  if (isSupabaseConfigured()) {
    return supabaseMutationResponse(await updateTaskStatusRecord(workspace, id, parsed.data.status));
  }
  const db = getDb();
  const [ownedTask] = await db.select({ id: tasks.id, title: tasks.title, projectStatus: projects.status }).from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .where(and(eq(tasks.id, id), eq(tasks.organizationId, workspace.organizationId))).limit(1);
  if (!ownedTask) return apiError("TASK_NOT_FOUND", "Tarefa não encontrada.", 404);
  if (ownedTask.projectStatus === "archived") return apiError("PROJECT_ARCHIVED", "Restaure o projeto antes de alterar tarefas.", 409);
  try {
    await db.batch([
      db.update(tasks).set({ status: parsed.data.status, completedAt: parsed.data.status === "done" ? sql`CURRENT_TIMESTAMP` : null, updatedAt: sql`CURRENT_TIMESTAMP` }).where(and(eq(tasks.id, id), eq(tasks.organizationId, workspace.organizationId))),
      db.insert(activities).values({ id: `act_${crypto.randomUUID()}`, organizationId: workspace.organizationId, actorUserId: workspace.userId, type: "task.status_updated", title: "Status da tarefa atualizado", detail: `${ownedTask.title}: ${statusLabel(parsed.data.status)}.`, resourceType: "task", resourceId: id }),
    ]);
  } catch (error) {
    console.error("task_update_failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return apiError("TASK_UPDATE_FAILED", "Não foi possível atualizar a tarefa.", 500);
  }
  return apiSuccess({ id, status: parsed.data.status });
}

function statusLabel(status: "todo" | "in_progress" | "done") { return status === "done" ? "concluída" : status === "in_progress" ? "em andamento" : "a fazer"; }

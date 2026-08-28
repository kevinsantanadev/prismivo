import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/app/session-auth";
import { getDb } from "@/db";
import { activities, notifications, projects, tasks } from "@/db/schema";
import { apiError, apiSuccess, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { taskSchema, zodFieldErrors } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { createTaskRecord } from "@/lib/supabase/mutations";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  if (!isJsonRequest(request)) return apiError("INVALID_CONTENT_TYPE", "Envie os dados no formato esperado.", 415);
  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);
  if (!hasPermission(workspace.role, "tasks.write")) return apiError("FORBIDDEN", "Seu papel não permite alterar tarefas.", 403);
  let payload: unknown;
  try { payload = await request.json(); } catch { return apiError("INVALID_JSON", "Dados inválidos.", 400); }
  const parsed = taskSchema.safeParse(payload);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Revise os campos destacados.", 422, zodFieldErrors(parsed.error));
  if (isSupabaseConfigured()) {
    return supabaseMutationResponse(await createTaskRecord(workspace, parsed.data), 201);
  }
  const db = getDb();
  const [ownedProject] = await db.select({ id: projects.id, name: projects.name }).from(projects)
    .where(and(eq(projects.id, parsed.data.projectId), eq(projects.organizationId, workspace.organizationId), eq(projects.status, "active"))).limit(1);
  if (!ownedProject) return apiError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
  const taskId = `tsk_${crypto.randomUUID()}`;
  try {
    await db.batch([
      db.insert(tasks).values({ id: taskId, organizationId: workspace.organizationId, projectId: ownedProject.id, assigneeUserId: workspace.userId, title: parsed.data.title, description: parsed.data.description, priority: parsed.data.priority, dueDate: parsed.data.dueDate || null }),
      db.insert(activities).values({ id: `act_${crypto.randomUUID()}`, organizationId: workspace.organizationId, actorUserId: workspace.userId, type: "task.created", title: "Nova tarefa criada", detail: `${parsed.data.title} foi adicionada a ${ownedProject.name}.`, resourceType: "task", resourceId: taskId }),
      db.insert(notifications).values({ id: `not_${crypto.randomUUID()}`, userId: workspace.userId, organizationId: workspace.organizationId, category: "task", title: "Tarefa adicionada ao fluxo", body: `${parsed.data.title} já pode ser acompanhada no projeto.` }),
    ]);
  } catch (error) {
    console.error("task_create_failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return apiError("TASK_CREATE_FAILED", "Não foi possível criar a tarefa agora.", 500);
  }
  return apiSuccess({ id: taskId }, { status: 201 });
}

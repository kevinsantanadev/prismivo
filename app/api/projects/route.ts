import { and, eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/app/session-auth";
import { getDb } from "@/db";
import { activities, clients, notifications, projects } from "@/db/schema";
import { apiError, apiSuccess, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { asD1Batch } from "@/lib/db-batch";
import { projectSchema, zodFieldErrors } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { createProjectRecord } from "@/lib/supabase/mutations";
import { activeProjectLimitForPlan, isActiveProjectLimitReached } from "@/lib/project-limits";

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
  if (!hasPermission(workspace.role, "projects.write")) return apiError("FORBIDDEN", "Seu papel não permite alterar projetos.", 403);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Não foi possível interpretar os dados enviados.", 400);
  }

  const parsed = projectSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Revise os campos destacados.", 422, zodFieldErrors(parsed.error));
  }

  if (isSupabaseConfigured()) {
    return supabaseMutationResponse(await createProjectRecord(workspace, parsed.data), 201);
  }

  const db = getDb();
  const [projectTotal] = await db
    .select({ value: sql<number>`count(*)` })
    .from(projects)
    .where(
      and(
        eq(projects.organizationId, workspace.organizationId),
        eq(projects.status, "active"),
      ),
    );

  const projectLimit = activeProjectLimitForPlan(workspace.plan);
  if (isActiveProjectLimitReached(Number(projectTotal?.value ?? 0), projectLimit)) {
    return apiError(
      "PLAN_LIMIT_REACHED",
      `Seu plano permite até ${projectLimit} projetos ativos. Arquive um projeto ou escolha outro plano.`,
      403,
    );
  }

  const [existingClient] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(
      and(
        eq(clients.organizationId, workspace.organizationId),
        eq(clients.name, parsed.data.clientName),
      ),
    )
    .limit(1);

  const clientId = existingClient?.id ?? `cli_${crypto.randomUUID()}`;
  const projectId = `prj_${crypto.randomUUID()}`;
  const statements = [];

  if (!existingClient) {
    statements.push(
      db.insert(clients).values({
        id: clientId,
        organizationId: workspace.organizationId,
        name: parsed.data.clientName,
      }),
    );
  }

  statements.push(
    db.insert(projects).values({
      id: projectId,
      organizationId: workspace.organizationId,
      clientId,
      name: parsed.data.name,
      description: parsed.data.description,
      dueDate: parsed.data.dueDate || null,
      progress: 0,
    }),
    db.insert(activities).values({
      id: `act_${crypto.randomUUID()}`,
      organizationId: workspace.organizationId,
      actorUserId: workspace.userId,
      type: "project.created",
      title: "Novo projeto criado",
      detail: `${parsed.data.name} foi associado a ${parsed.data.clientName}.`,
      resourceType: "project",
      resourceId: projectId,
    }),
    db.insert(notifications).values({
      id: `not_${crypto.randomUUID()}`,
      userId: workspace.userId,
      organizationId: workspace.organizationId,
      category: "project",
      title: "Projeto pronto para começar",
      body: `${parsed.data.name} já aparece no seu painel.`,
    }),
  );

  try {
    await db.batch(asD1Batch(statements));
  } catch (error) {
    console.error("project_create_failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return apiError("PROJECT_CREATE_FAILED", "Não foi possível criar o projeto agora.", 500);
  }

  return apiSuccess({ id: projectId }, { status: 201 });
}

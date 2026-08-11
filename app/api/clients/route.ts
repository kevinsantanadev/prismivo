import { and, eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/app/session-auth";
import { getDb } from "@/db";
import { activities, clients, notifications } from "@/db/schema";
import { apiError, apiSuccess, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { clientSchema, zodFieldErrors } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { createClientRecord } from "@/lib/supabase/mutations";

const FREE_CLIENT_LIMIT = 3;

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
  if (!hasPermission(workspace.role, "clients.write")) return apiError("FORBIDDEN", "Seu papel não permite alterar clientes.", 403);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Não foi possível interpretar os dados enviados.", 400);
  }

  const parsed = clientSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Revise os campos destacados.", 422, zodFieldErrors(parsed.error));
  }

  if (isSupabaseConfigured()) {
    return supabaseMutationResponse(await createClientRecord(workspace, parsed.data), 201);
  }

  const db = getDb();
  const [clientTotal] = await db
    .select({ value: sql<number>`count(*)` })
    .from(clients)
    .where(and(eq(clients.organizationId, workspace.organizationId), eq(clients.status, "active")));

  if (workspace.plan === "free" && Number(clientTotal?.value ?? 0) >= FREE_CLIENT_LIMIT) {
    return apiError(
      "PLAN_LIMIT_REACHED",
      "O plano gratuito permite até 3 clientes ativos.",
      403,
    );
  }

  const clientId = `cli_${crypto.randomUUID()}`;
  try {
    await db.batch([
      db.insert(clients).values({
        id: clientId,
        organizationId: workspace.organizationId,
        name: parsed.data.name,
        email: parsed.data.email || null,
        company: parsed.data.company || null,
      }),
      db.insert(activities).values({
        id: `act_${crypto.randomUUID()}`,
        organizationId: workspace.organizationId,
        actorUserId: workspace.userId,
        type: "client.created",
        title: "Novo cliente adicionado",
        detail: `${parsed.data.name} entrou na carteira ativa.`,
        resourceType: "client",
        resourceId: clientId,
      }),
      db.insert(notifications).values({
        id: `not_${crypto.randomUUID()}`,
        userId: workspace.userId,
        organizationId: workspace.organizationId,
        category: "client",
        title: "Cliente pronto para receber projetos",
        body: `${parsed.data.name} foi adicionado com sucesso.`,
      }),
    ]);
  } catch (error) {
    console.error("client_create_failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return apiError("CLIENT_CREATE_FAILED", "Não foi possível adicionar o cliente agora.", 500);
  }

  return apiSuccess({ id: clientId }, { status: 201 });
}

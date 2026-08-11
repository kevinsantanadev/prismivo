import { eq } from "drizzle-orm";
import { getSessionUser } from "@/app/session-auth";
import { getDb } from "@/db";
import {
  activities,
  approvals,
  clients,
  consents,
  memberships,
  notifications,
  organizations,
  projects,
  supportTickets,
  tasks,
  ticketMessages,
  users,
} from "@/db/schema";
import { apiError, apiSuccess, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { asD1Batch } from "@/lib/db-batch";
import { onboardingSchema, zodFieldErrors } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseWorkspace } from "@/lib/supabase/onboarding";

const MAX_BODY_BYTES = 12_000;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return apiError("INVALID_ORIGIN", "Não foi possível validar a origem da solicitação.", 403);
  }
  if (!isJsonRequest(request)) {
    return apiError("INVALID_CONTENT_TYPE", "Envie os dados no formato esperado.", 415);
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return apiError("PAYLOAD_TOO_LARGE", "Os dados enviados excedem o limite permitido.", 413);
  }

  const identity = await getSessionUser();
  if (!identity) {
    return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Não foi possível interpretar os dados enviados.", 400);
  }

  const parsed = onboardingSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "Revise os campos destacados.",
      422,
      zodFieldErrors(parsed.error),
    );
  }

  if (isSupabaseConfigured()) {
    try {
      const result = await createSupabaseWorkspace(identity, parsed.data);
      return apiSuccess(result, { status: result.created ? 201 : 200 });
    } catch (error) {
      console.error("supabase_onboarding_failed", {
        name: error instanceof Error ? error.message : "UnknownError",
      });
      return apiError(
        "ONBOARDING_FAILED",
        "Não foi possível criar o espaço agora. Tente novamente em instantes.",
        500,
      );
    }
  }

  const existingWorkspace = await findWorkspaceByEmail(identity.email);
  if (existingWorkspace) {
    return apiSuccess({ redirectTo: "/app", created: false });
  }

  const db = getDb();
  const normalizedEmail = identity.email.trim().toLowerCase();
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  const [slugInUse] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, parsed.data.slug))
    .limit(1);

  const suffix = crypto.randomUUID().slice(0, 5);
  const organizationSlug = slugInUse ? `${parsed.data.slug}-${suffix}` : parsed.data.slug;
  const userId = existingUser?.id ?? `usr_${crypto.randomUUID()}`;
  const organizationId = `org_${crypto.randomUUID()}`;
  const membershipId = `mem_${crypto.randomUUID()}`;
  const clientId = `cli_${crypto.randomUUID()}`;
  const projectId = `prj_${crypto.randomUUID()}`;
  const approvalId = `apr_${crypto.randomUUID()}`;
  const taskId = `tsk_${crypto.randomUUID()}`;
  const ticketId = `tic_${crypto.randomUUID()}`;
  const ticketProtocol = `PRI-${new Date().getUTCFullYear()}-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;

  const statements = [];
  if (!existingUser) {
    statements.push(
      db.insert(users).values({
        id: userId,
        email: normalizedEmail,
        name: identity.fullName?.trim() || identity.displayName,
      }),
    );
  }

  statements.push(
    db.insert(organizations).values({
      id: organizationId,
      name: parsed.data.organizationName,
      slug: organizationSlug,
      industry: parsed.data.industry,
      teamSize: parsed.data.teamSize,
      plan: "free",
    }),
    db.insert(memberships).values({
      id: membershipId,
      userId,
      organizationId,
      role: "owner",
    }),
    db.insert(consents).values({
      id: `con_${crypto.randomUUID()}`,
      userId,
      type: "terms_of_use",
      version: TERMS_VERSION,
      accepted: true,
    }),
    db.insert(consents).values({
      id: `con_${crypto.randomUUID()}`,
      userId,
      type: "privacy_notice",
      version: PRIVACY_VERSION,
      accepted: true,
    }),
    db.insert(clients).values({
      id: clientId,
      organizationId,
      name: "Cliente Aurora",
      company: "Cenário demonstrativo",
      status: "active",
      isDemo: true,
    }),
    db.insert(projects).values({
      id: projectId,
      organizationId,
      clientId,
      name: "Projeto Aurora",
      description: "Projeto demonstrativo para você conhecer o fluxo do Prismivo.",
      status: "active",
      progress: 78,
      isDemo: true,
    }),
    db.insert(approvals).values({
      id: approvalId,
      organizationId,
      projectId,
      title: "Aprovar briefing inicial",
      description: "Exemplo de solicitação com decisão rastreável no Prismivo.",
      status: "pending",
    }),
    db.insert(tasks).values({ id: taskId, organizationId, projectId, assigneeUserId: userId, title: "Revisar cronograma do Projeto Aurora", description: "Tarefa demonstrativa para conhecer o quadro de execução.", priority: "medium", status: "in_progress" }),
    db.insert(supportTickets).values({ id: ticketId, organizationId, requesterUserId: userId, clientId, protocol: ticketProtocol, category: "question", priority: "normal", subject: "Como funciona o histórico de atendimento?", status: "open" }),
    db.insert(ticketMessages).values({ id: `msg_${crypto.randomUUID()}`, ticketId, organizationId, authorUserId: userId, body: "Esta é uma conversa demonstrativa. Novas respostas ficam registradas em ordem cronológica." }),
    db.insert(activities).values({
      id: `act_${crypto.randomUUID()}`,
      organizationId,
      actorUserId: userId,
      type: "workspace.created",
      title: "Espaço criado com sucesso",
      detail: `${parsed.data.organizationName} iniciou o plano gratuito.`,
      resourceType: "organization",
      resourceId: organizationId,
    }),
    db.insert(notifications).values({
      id: `not_${crypto.randomUUID()}`,
      userId,
      organizationId,
      category: "onboarding",
      title: "Bem-vindo ao Prismivo",
      body: "Seu espaço está pronto. Explore o Projeto Aurora ou crie seu primeiro projeto real.",
    }),
  );

  try {
    await db.batch(asD1Batch(statements));
  } catch (error) {
    console.error("onboarding_failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return apiError(
      "ONBOARDING_FAILED",
      "Não foi possível criar o espaço agora. Tente novamente em instantes.",
      500,
    );
  }

  return apiSuccess({ redirectTo: "/app", created: true }, { status: 201 });
}

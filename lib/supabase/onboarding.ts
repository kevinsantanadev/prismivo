import type { SessionUser } from "@/app/session-auth";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";
import { createSupabaseServerClient } from "./server";
import { findSupabaseWorkspaceByEmail } from "./workspace";

type OnboardingInput = {
  organizationName: string;
  slug: string;
  industry: string;
  teamSize: string;
};

export async function createSupabaseWorkspace(identity: SessionUser, input: OnboardingInput) {
  if (!identity.id) throw new Error("Authenticated Supabase user id is required.");

  const existing = await findSupabaseWorkspaceByEmail(identity.email);
  if (existing) return { created: false, redirectTo: "/app" };

  const supabase = await createSupabaseServerClient();
  const userId = identity.id;
  const normalizedEmail = identity.email.trim().toLowerCase();
  const organizationId = `org_${crypto.randomUUID()}`;
  const requestedSlug = input.slug;

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!existingProfile) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      email: normalizedEmail,
      name: identity.fullName?.trim() || identity.displayName,
      locale: "pt-BR",
    });
    if (profileError) throw new Error("profile_create_failed");
  }

  const organization = await insertOrganizationWithUniqueSlug({
    organizationId,
    createdBy: userId,
    requestedSlug,
    name: input.organizationName,
    industry: input.industry,
    teamSize: input.teamSize,
  });

  const { error: membershipError } = await supabase.from("memberships").insert({
    id: `mem_${crypto.randomUUID()}`,
    user_id: userId,
    organization_id: organizationId,
    role: "owner",
    status: "active",
  });

  if (membershipError) {
    await supabase.from("organizations").delete().eq("id", organizationId);
    throw new Error("membership_create_failed");
  }

  await seedWorkspace({ supabase, userId, organizationId, organizationName: input.organizationName });

  return { created: true, redirectTo: "/app", slug: organization.slug };
}

async function insertOrganizationWithUniqueSlug(input: {
  organizationId: string;
  createdBy: string;
  requestedSlug: string;
  name: string;
  industry: string;
  teamSize: string;
}) {
  const supabase = await createSupabaseServerClient();
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const slug = attempt === 0
      ? input.requestedSlug
      : `${input.requestedSlug}-${crypto.randomUUID().slice(0, 5)}`;
    const { error } = await supabase.from("organizations").insert({
      id: input.organizationId,
      created_by: input.createdBy,
      name: input.name,
      slug,
      industry: input.industry,
      team_size: input.teamSize,
      plan: "free",
    });
    if (!error) return { slug };
    if (error.code !== "23505" || attempt === 1) throw new Error("organization_create_failed");
  }
  throw new Error("organization_create_failed");
}

async function seedWorkspace(input: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
  organizationId: string;
  organizationName: string;
}) {
  const { supabase, userId, organizationId, organizationName } = input;
  const clientId = `cli_${crypto.randomUUID()}`;
  const projectId = `prj_${crypto.randomUUID()}`;
  const ticketId = `tic_${crypto.randomUUID()}`;
  const protocol = `PRI-${new Date().getUTCFullYear()}-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;

  const consentResult = await supabase.from("consents").insert([
    { id: `con_${crypto.randomUUID()}`, user_id: userId, type: "terms_of_use", version: TERMS_VERSION, accepted: true },
    { id: `con_${crypto.randomUUID()}`, user_id: userId, type: "privacy_notice", version: PRIVACY_VERSION, accepted: true },
  ]);
  const clientResult = await supabase.from("clients").insert({
    id: clientId,
    organization_id: organizationId,
    name: "Cliente Aurora",
    company: "Cenário demonstrativo",
    is_demo: true,
  });
  const projectResult = clientResult.error
    ? { error: clientResult.error }
    : await supabase.from("projects").insert({
      id: projectId,
      organization_id: organizationId,
      client_id: clientId,
      name: "Projeto Aurora",
      description: "Projeto demonstrativo para conhecer o fluxo do Prismivo.",
      progress: 78,
      is_demo: true,
    });

  if (consentResult.error || clientResult.error || projectResult.error) {
    console.error("supabase_demo_seed_base_failed");
    return;
  }

  const ticketResult = await supabase.from("support_tickets").insert({
    id: ticketId,
    organization_id: organizationId,
    requester_user_id: userId,
    client_id: clientId,
    protocol,
    category: "question",
    priority: "normal",
    subject: "Como funciona o histórico de atendimento?",
  });
  const messageResult = ticketResult.error
    ? { error: ticketResult.error }
    : await supabase.from("ticket_messages").insert({
      id: `msg_${crypto.randomUUID()}`,
      ticket_id: ticketId,
      organization_id: organizationId,
      author_user_id: userId,
      body: "Esta é uma conversa demonstrativa. Novas respostas ficam registradas em ordem cronológica.",
    });

  const detailResults = await Promise.all([
    supabase.from("approvals").insert({ id: `apr_${crypto.randomUUID()}`, organization_id: organizationId, project_id: projectId, title: "Aprovar briefing inicial", description: "Exemplo de solicitação com decisão rastreável no Prismivo." }),
    supabase.from("tasks").insert({ id: `tsk_${crypto.randomUUID()}`, organization_id: organizationId, project_id: projectId, assignee_user_id: userId, title: "Revisar cronograma do Projeto Aurora", description: "Tarefa demonstrativa para conhecer o quadro de execução.", priority: "medium", status: "in_progress" }),
    supabase.from("activities").insert({ id: `act_${crypto.randomUUID()}`, organization_id: organizationId, actor_user_id: userId, type: "workspace.created", title: "Espaço criado com sucesso", detail: `${organizationName} iniciou o plano gratuito.`, resource_type: "organization", resource_id: organizationId }),
    supabase.from("notifications").insert({ id: `not_${crypto.randomUUID()}`, user_id: userId, organization_id: organizationId, category: "onboarding", title: "Bem-vindo ao Prismivo", body: "Seu espaço está pronto. Explore o Projeto Aurora ou crie seu primeiro projeto real." }),
  ]);

  if (ticketResult.error || messageResult.error || detailResults.some((result) => result.error)) {
    console.error("supabase_demo_seed_detail_failed");
  }
}

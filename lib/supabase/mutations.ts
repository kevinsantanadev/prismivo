import { createSupabaseServerClient } from "./server";

type Workspace = {
  userId: string;
  organizationId: string;
  organizationName: string;
  plan: string;
  role: string;
};

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; status: number };

export async function createClientRecord(workspace: Workspace, input: { name: string; email?: string; company?: string }): Promise<MutationResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient();
  const { count, error: countError } = await supabase.from("clients").select("id", { count: "exact", head: true }).eq("organization_id", workspace.organizationId).eq("status", "active");
  if (countError) return failed();
  if (workspace.plan === "free" && (count ?? 0) >= 3) return fail("PLAN_LIMIT_REACHED", "O plano gratuito permite até 3 clientes ativos.", 403);
  const id = `cli_${crypto.randomUUID()}`;
  const { error } = await supabase.from("clients").insert({ id, organization_id: workspace.organizationId, name: input.name, email: input.email || null, company: input.company || null });
  if (error) return failed("CLIENT_CREATE_FAILED", "Não foi possível adicionar o cliente agora.");
  await recordSideEffects(workspace, {
    activity: { type: "client.created", title: "Novo cliente adicionado", detail: `${input.name} entrou na carteira ativa.`, resourceType: "client", resourceId: id },
    notification: { category: "client", title: "Cliente pronto para receber projetos", body: `${input.name} foi adicionado com sucesso.` },
  });
  return success({ id });
}

export async function createProjectRecord(workspace: Workspace, input: { name: string; clientName: string; description: string; dueDate?: string }): Promise<MutationResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient();
  const { count, error: countError } = await supabase.from("projects").select("id", { count: "exact", head: true }).eq("organization_id", workspace.organizationId).eq("status", "active");
  if (countError) return failed();
  if (workspace.plan === "free" && (count ?? 0) >= 3) return fail("PLAN_LIMIT_REACHED", "O plano gratuito permite até 3 projetos ativos. Arquive um projeto ou escolha outro plano.", 403);

  const { data: existingClient, error: clientLookupError } = await supabase.from("clients").select("id").eq("organization_id", workspace.organizationId).eq("name", input.clientName).limit(1).maybeSingle();
  if (clientLookupError) return failed();
  const clientId = existingClient?.id ?? `cli_${crypto.randomUUID()}`;
  let createdClient = false;
  if (!existingClient) {
    const { error } = await supabase.from("clients").insert({ id: clientId, organization_id: workspace.organizationId, name: input.clientName });
    if (error) return failed();
    createdClient = true;
  }

  const id = `prj_${crypto.randomUUID()}`;
  const { error } = await supabase.from("projects").insert({ id, organization_id: workspace.organizationId, client_id: clientId, name: input.name, description: input.description, due_date: input.dueDate || null, progress: 0 });
  if (error) {
    if (createdClient) await supabase.from("clients").delete().eq("id", clientId);
    return failed("PROJECT_CREATE_FAILED", "Não foi possível criar o projeto agora.");
  }
  await recordSideEffects(workspace, {
    activity: { type: "project.created", title: "Novo projeto criado", detail: `${input.name} foi associado a ${input.clientName}.`, resourceType: "project", resourceId: id },
    notification: { category: "project", title: "Projeto pronto para começar", body: `${input.name} já aparece no seu painel.` },
  });
  return success({ id });
}

export async function updateProjectProgressRecord(workspace: Workspace, id: string, progress: number): Promise<MutationResult<{ id: string; progress: number }>> {
  const supabase = await createSupabaseServerClient();
  const { data: project, error: lookupError } = await supabase.from("projects").select("id, name").eq("organization_id", workspace.organizationId).eq("id", id).maybeSingle();
  if (lookupError) return failed();
  if (!project) return fail("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
  const { error } = await supabase.from("projects").update({ progress, status: progress === 100 ? "completed" : "active", updated_at: new Date().toISOString() }).eq("organization_id", workspace.organizationId).eq("id", id);
  if (error) return failed("PROJECT_PROGRESS_FAILED", "Não foi possível atualizar o progresso.");
  await recordActivity(workspace, { type: "project.progress_updated", title: "Progresso atualizado", detail: `${project.name} avançou para ${progress}%.`, resourceType: "project", resourceId: id });
  return success({ id, progress });
}

export async function createApprovalRecord(workspace: Workspace, input: { projectId: string; title: string; description: string; dueDate?: string }): Promise<MutationResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: project, error: lookupError } = await supabase.from("projects").select("id, name").eq("organization_id", workspace.organizationId).eq("id", input.projectId).maybeSingle();
  if (lookupError) return failed();
  if (!project) return fail("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
  const id = `apr_${crypto.randomUUID()}`;
  const { error } = await supabase.from("approvals").insert({ id, organization_id: workspace.organizationId, project_id: project.id, title: input.title, description: input.description, due_date: input.dueDate || null });
  if (error) return failed("APPROVAL_CREATE_FAILED", "Não foi possível criar a aprovação agora.");
  await recordSideEffects(workspace, {
    activity: { type: "approval.created", title: "Aprovação solicitada", detail: `${input.title} foi vinculada a ${project.name}.`, resourceType: "approval", resourceId: id },
    notification: { category: "approval", title: "Nova aprovação pendente", body: `${input.title} aguarda uma decisão.` },
  });
  return success({ id });
}

export async function decideApprovalRecord(workspace: Workspace, id: string, decision: "approved" | "changes_requested"): Promise<MutationResult<{ id: string; status: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: approval, error: lookupError } = await supabase.from("approvals").select("id, title, status").eq("organization_id", workspace.organizationId).eq("id", id).maybeSingle();
  if (lookupError) return failed();
  if (!approval) return fail("APPROVAL_NOT_FOUND", "Aprovação não encontrada.", 404);
  if (approval.status !== "pending") return fail("APPROVAL_ALREADY_DECIDED", "Essa aprovação já recebeu uma decisão.", 409);
  const approved = decision === "approved";
  const { error } = await supabase.from("approvals").update({ status: decision, decided_by_user_id: workspace.userId, decided_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("organization_id", workspace.organizationId).eq("id", id);
  if (error) return failed("APPROVAL_DECISION_FAILED", "Não foi possível registrar a decisão agora.");
  await recordSideEffects(workspace, {
    activity: { type: approved ? "approval.approved" : "approval.changes_requested", title: approved ? "Entrega aprovada" : "Ajustes solicitados", detail: approval.title, resourceType: "approval", resourceId: id },
    notification: { category: "approval", title: approved ? "Aprovação concluída" : "Solicitação devolvida para ajustes", body: `${approval.title} teve o status atualizado.` },
  });
  return success({ id, status: decision });
}

export async function createTaskRecord(workspace: Workspace, input: { projectId: string; title: string; description: string; priority: string; dueDate?: string }): Promise<MutationResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: project, error: lookupError } = await supabase.from("projects").select("id, name").eq("organization_id", workspace.organizationId).eq("id", input.projectId).maybeSingle();
  if (lookupError) return failed();
  if (!project) return fail("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
  const id = `tsk_${crypto.randomUUID()}`;
  const { error } = await supabase.from("tasks").insert({ id, organization_id: workspace.organizationId, project_id: project.id, assignee_user_id: workspace.userId, title: input.title, description: input.description, priority: input.priority, due_date: input.dueDate || null });
  if (error) return failed("TASK_CREATE_FAILED", "Não foi possível criar a tarefa agora.");
  await recordSideEffects(workspace, {
    activity: { type: "task.created", title: "Nova tarefa criada", detail: `${input.title} foi adicionada a ${project.name}.`, resourceType: "task", resourceId: id },
    notification: { category: "task", title: "Tarefa adicionada ao fluxo", body: `${input.title} já pode ser acompanhada no projeto.` },
  });
  return success({ id });
}

export async function updateTaskStatusRecord(workspace: Workspace, id: string, status: "todo" | "in_progress" | "done"): Promise<MutationResult<{ id: string; status: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: task, error: lookupError } = await supabase.from("tasks").select("id, title").eq("organization_id", workspace.organizationId).eq("id", id).maybeSingle();
  if (lookupError) return failed();
  if (!task) return fail("TASK_NOT_FOUND", "Tarefa não encontrada.", 404);
  const { error } = await supabase.from("tasks").update({ status, completed_at: status === "done" ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("organization_id", workspace.organizationId).eq("id", id);
  if (error) return failed("TASK_UPDATE_FAILED", "Não foi possível atualizar a tarefa.");
  await recordActivity(workspace, { type: "task.status_updated", title: "Status da tarefa atualizado", detail: `${task.title}: ${taskStatusLabel(status)}.`, resourceType: "task", resourceId: id });
  return success({ id, status });
}

export async function markNotificationsRead(workspace: Workspace, input: { markAll?: boolean; notificationId?: string }): Promise<MutationResult<{ updated: true }>> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("organization_id", workspace.organizationId).eq("user_id", workspace.userId);
  if (!input.markAll && input.notificationId) query = query.eq("id", input.notificationId);
  const { error } = await query;
  return error ? failed("NOTIFICATION_UPDATE_FAILED", "Não foi possível atualizar as notificações.") : success({ updated: true });
}

export async function updateSettingsRecord(workspace: Workspace, input: { name: string; locale: string; organizationName: string }): Promise<MutationResult<{ updated: true }>> {
  const supabase = await createSupabaseServerClient();
  const { error: profileError } = await supabase.from("profiles").update({ name: input.name, locale: input.locale, updated_at: new Date().toISOString() }).eq("id", workspace.userId);
  if (profileError) return failed("SETTINGS_UPDATE_FAILED", "Não foi possível salvar as configurações.");
  if (workspace.role === "owner") {
    const { error } = await supabase.from("organizations").update({ name: input.organizationName, updated_at: new Date().toISOString() }).eq("id", workspace.organizationId).eq("status", "active");
    if (error) return failed("SETTINGS_UPDATE_FAILED", "Não foi possível salvar as configurações.");
  }
  await recordActivity(workspace, { type: "settings.updated", title: "Configurações atualizadas", detail: "Perfil e preferências foram salvos.", resourceType: "user", resourceId: workspace.userId });
  return success({ updated: true });
}

export async function createTicketRecord(workspace: Workspace, input: { clientId?: string; category: string; priority: string; subject: string; message: string }): Promise<MutationResult<{ id: string; protocol: string }>> {
  const supabase = await createSupabaseServerClient();
  const clientId = input.clientId || null;
  if (clientId) {
    const { data, error } = await supabase.from("clients").select("id").eq("organization_id", workspace.organizationId).eq("id", clientId).maybeSingle();
    if (error) return failed();
    if (!data) return fail("CLIENT_NOT_FOUND", "Cliente não encontrado.", 404);
  }
  const id = `tic_${crypto.randomUUID()}`;
  const protocol = `PRI-${new Date().getUTCFullYear()}-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
  const { error } = await supabase.from("support_tickets").insert({ id, organization_id: workspace.organizationId, requester_user_id: workspace.userId, client_id: clientId, protocol, category: input.category, priority: input.priority, subject: input.subject });
  if (error) return failed("TICKET_CREATE_FAILED", "Não foi possível abrir o atendimento agora.");
  const { error: messageError } = await supabase.from("ticket_messages").insert({ id: `msg_${crypto.randomUUID()}`, ticket_id: id, organization_id: workspace.organizationId, author_user_id: workspace.userId, body: input.message });
  if (messageError) {
    await supabase.from("support_tickets").delete().eq("id", id);
    return failed("TICKET_CREATE_FAILED", "Não foi possível abrir o atendimento agora.");
  }
  await recordSideEffects(workspace, {
    activity: { type: "ticket.created", title: "Atendimento aberto", detail: `${protocol}: ${input.subject}`, resourceType: "ticket", resourceId: id },
    notification: { category: "support", title: "Solicitação registrada", body: `${protocol} foi aberto e já possui histórico.` },
  });
  return success({ id, protocol });
}

export async function addTicketMessageRecord(workspace: Workspace, id: string, message: string): Promise<MutationResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: ticket, error: lookupError } = await supabase.from("support_tickets").select("id, protocol, status").eq("organization_id", workspace.organizationId).eq("id", id).maybeSingle();
  if (lookupError) return failed();
  if (!ticket) return fail("TICKET_NOT_FOUND", "Atendimento não encontrado.", 404);
  if (ticket.status === "closed") return fail("TICKET_CLOSED", "Reabra o atendimento antes de responder.", 409);
  const messageId = `msg_${crypto.randomUUID()}`;
  const { error } = await supabase.from("ticket_messages").insert({ id: messageId, ticket_id: id, organization_id: workspace.organizationId, author_user_id: workspace.userId, body: message });
  if (error) return failed("TICKET_MESSAGE_FAILED", "Não foi possível registrar a resposta.");
  await supabase.from("support_tickets").update({ updated_at: new Date().toISOString() }).eq("id", id);
  await recordSideEffects(workspace, {
    activity: { type: "ticket.message_added", title: "Resposta adicionada ao atendimento", detail: ticket.protocol, resourceType: "ticket", resourceId: id },
    notification: { category: "support", title: "Resposta registrada", body: `A conversa de ${ticket.protocol} foi atualizada.` },
  });
  return success({ id: messageId });
}

export async function updateTicketStatusRecord(workspace: Workspace, id: string, action: "close" | "reopen"): Promise<MutationResult<{ id: string; status: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: ticket, error: lookupError } = await supabase.from("support_tickets").select("id, protocol").eq("organization_id", workspace.organizationId).eq("id", id).maybeSingle();
  if (lookupError) return failed();
  if (!ticket) return fail("TICKET_NOT_FOUND", "Atendimento não encontrado.", 404);
  const status = action === "close" ? "closed" : "open";
  const { error } = await supabase.from("support_tickets").update({ status, closed_at: status === "closed" ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return failed("TICKET_STATUS_FAILED", "Não foi possível alterar o atendimento.");
  await recordActivity(workspace, { type: `ticket.${status}`, title: status === "closed" ? "Atendimento encerrado" : "Atendimento reaberto", detail: ticket.protocol, resourceType: "ticket", resourceId: id });
  return success({ id, status });
}

type ActivityInput = { type: string; title: string; detail: string; resourceType: string; resourceId: string };
type NotificationInput = { category: string; title: string; body: string };

async function recordActivity(workspace: Workspace, activity: ActivityInput) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("activities").insert({ id: `act_${crypto.randomUUID()}`, organization_id: workspace.organizationId, actor_user_id: workspace.userId, type: activity.type, title: activity.title, detail: activity.detail, resource_type: activity.resourceType, resource_id: activity.resourceId });
}

async function recordSideEffects(workspace: Workspace, input: { activity: ActivityInput; notification: NotificationInput }) {
  const supabase = await createSupabaseServerClient();
  await Promise.all([
    recordActivity(workspace, input.activity),
    supabase.from("notifications").insert({ id: `not_${crypto.randomUUID()}`, user_id: workspace.userId, organization_id: workspace.organizationId, category: input.notification.category, title: input.notification.title, body: input.notification.body }),
  ]);
}

function success<T>(data: T): MutationResult<T> {
  return { ok: true, data };
}

function fail<T>(code: string, message: string, status: number): MutationResult<T> {
  return { ok: false, code, message, status };
}

function failed<T>(code = "OPERATION_FAILED", message = "Não foi possível concluir a operação agora."): MutationResult<T> {
  return fail(code, message, 500);
}

function taskStatusLabel(status: "todo" | "in_progress" | "done") {
  return status === "done" ? "concluída" : status === "in_progress" ? "em andamento" : "a fazer";
}

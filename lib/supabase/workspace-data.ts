import { createSupabaseServerClient } from "./server";
import { getTicketAttachments } from "./ticket-attachments";

type ClientRelation = { name: string | null; company?: string | null };
type ProjectRelation = { id: string; name: string; client?: ClientRelation | ClientRelation[] | null };

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export async function getSupabaseClientsData(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, company, status, is_demo, created_at, projects(count)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    status: row.status,
    isDemo: row.is_demo,
    createdAt: row.created_at,
    projectCount: Number(one(row.projects)?.count ?? 0),
  }));
}

export async function getSupabaseProjectsData(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, status, progress, due_date, is_demo, created_at, client:clients(name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    progress: row.progress,
    dueDate: row.due_date,
    isDemo: row.is_demo,
    clientName: one(row.client)?.name ?? null,
    createdAt: row.created_at,
  }));
}

export async function getSupabaseClientDetail(organizationId: string, clientId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: client, error } = await supabase
    .from("clients")
    .select("id, name, email, company, status, is_demo, created_at")
    .eq("organization_id", organizationId)
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw error;
  if (!client) return null;
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name, description, status, progress, due_date, is_demo, created_at")
    .eq("organization_id", organizationId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (projectsError) throw projectsError;
  return {
    client: { id: client.id, name: client.name, email: client.email, company: client.company, status: client.status, isDemo: client.is_demo, createdAt: client.created_at },
    projects: (projects ?? []).map((project) => ({ id: project.id, name: project.name, description: project.description, status: project.status, progress: project.progress, dueDate: project.due_date, isDemo: project.is_demo, createdAt: project.created_at })),
  };
}

export async function getSupabaseProjectDetail(organizationId: string, projectId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, status, progress, due_date, is_demo, created_at, client_id, client:clients(name, company)")
    .eq("organization_id", organizationId)
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const client = one(data.client);
  return { id: data.id, name: data.name, description: data.description, status: data.status, progress: data.progress, dueDate: data.due_date, isDemo: data.is_demo, createdAt: data.created_at, clientId: data.client_id, clientName: client?.name ?? null, clientCompany: client?.company ?? null };
}

export async function getSupabaseTasksData(organizationId: string, projectId?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("tasks")
    .select("id, title, description, status, priority, due_date, completed_at, created_at, project:projects!inner(id, name, client:clients(name))")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => {
    const project = one(row.project) as ProjectRelation | null;
    return { id: row.id, title: row.title, description: row.description, status: row.status, priority: row.priority, dueDate: row.due_date, completedAt: row.completed_at, createdAt: row.created_at, projectId: project?.id ?? "", projectName: project?.name ?? "Projeto", clientName: one(project?.client)?.name ?? null };
  });
}

export async function getSupabaseProjectApprovals(organizationId: string, projectId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("approvals")
    .select("id, title, description, status, due_date, decided_at, created_at")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, title: row.title, description: row.description, status: row.status, dueDate: row.due_date, decidedAt: row.decided_at, createdAt: row.created_at }));
}

export async function getSupabaseFilesData(organizationId: string, projectId?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("files")
    .select("id, original_name, content_type, size_bytes, created_at, uploaded_by_user_id, project_id, project:projects(name)")
    .eq("organization_id", organizationId)
    .eq("status", "available")
    .order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  if (error) throw error;
  const rows = data ?? [];
  const names = await profileNames(rows.map((row) => row.uploaded_by_user_id));
  return rows.map((row) => ({ id: row.id, originalName: row.original_name, contentType: row.content_type, sizeBytes: Number(row.size_bytes), createdAt: row.created_at, uploadedByUserId: row.uploaded_by_user_id, uploaderName: names.get(row.uploaded_by_user_id) ?? "Usuário", projectId: row.project_id, projectName: one(row.project)?.name ?? null }));
}

export async function getSupabaseTicketsData(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, protocol, category, priority, subject, status, created_at, updated_at, requester_user_id, client:clients(name)")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const names = await profileNames(rows.map((row) => row.requester_user_id));
  return rows.map((row) => ({ id: row.id, protocol: row.protocol, category: row.category, priority: row.priority, subject: row.subject, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, clientName: one(row.client)?.name ?? null, requesterName: names.get(row.requester_user_id) ?? "Usuário" }));
}

export async function getSupabaseTicketDetail(organizationId: string, ticketId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select("id, protocol, category, priority, subject, status, created_at, updated_at, closed_at, requester_user_id, client:clients(name)")
    .eq("organization_id", organizationId)
    .eq("id", ticketId)
    .maybeSingle();
  if (error) throw error;
  if (!ticket) return null;
  const { data: messages, error: messagesError } = await supabase
    .from("ticket_messages")
    .select("id, body, created_at, author_user_id")
    .eq("organization_id", organizationId)
    .eq("ticket_id", ticketId)
    .eq("is_internal", false)
    .order("created_at", { ascending: true });
  if (messagesError) throw messagesError;
  const attachments = await getTicketAttachments(organizationId, ticketId);
  const authorIds = [ticket.requester_user_id, ...(messages ?? []).map((message) => message.author_user_id)];
  const names = await profileNames(authorIds);
  return {
    ticket: { id: ticket.id, protocol: ticket.protocol, category: ticket.category, priority: ticket.priority, subject: ticket.subject, status: ticket.status, createdAt: ticket.created_at, updatedAt: ticket.updated_at, closedAt: ticket.closed_at, clientName: one(ticket.client)?.name ?? null, requesterName: names.get(ticket.requester_user_id) ?? "Usuário" },
    messages: (messages ?? []).map((message) => ({ id: message.id, body: message.body, createdAt: message.created_at, authorUserId: message.author_user_id, authorName: names.get(message.author_user_id) ?? "Usuário" })),
    attachments,
  };
}

export async function getSupabaseApprovalsData(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("approvals")
    .select("id, title, description, status, due_date, decided_at, created_at, project_id, project:projects!inner(name, client:clients(name))")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const project = one(row.project);
    return { id: row.id, title: row.title, description: row.description, status: row.status, dueDate: row.due_date, decidedAt: row.decided_at, createdAt: row.created_at, projectId: row.project_id, projectName: project?.name ?? "Projeto", clientName: one(project?.client)?.name ?? null };
  });
}

export async function getSupabaseNotificationsData(organizationId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, category, title, body, read_at, created_at")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, category: row.category, title: row.title, body: row.body, readAt: row.read_at, createdAt: row.created_at }));
}

export async function getSupabaseUnreadNotificationCount(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function getSupabaseDashboardData(organizationId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  const [clientsCount, projectsCount, unreadCount, projectsResult, activitiesResult, notificationsResult] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null),
    supabase.from("projects").select("id, name, description, status, progress, due_date, is_demo, client:clients(name)").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(8),
    supabase.from("activities").select("id, type, title, detail, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(6),
    supabase.from("notifications").select("id, category, title, body, read_at, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
  ]);
  const firstError = [clientsCount.error, projectsCount.error, unreadCount.error, projectsResult.error, activitiesResult.error, notificationsResult.error].find(Boolean);
  if (firstError) throw firstError;
  return {
    metrics: { clients: clientsCount.count ?? 0, projects: projectsCount.count ?? 0, unread: unreadCount.count ?? 0, approvalRate: 78 },
    projects: (projectsResult.data ?? []).map((row) => ({ id: row.id, name: row.name, description: row.description, status: row.status, progress: row.progress, dueDate: row.due_date, isDemo: row.is_demo, clientName: one(row.client)?.name ?? null })),
    activities: (activitiesResult.data ?? []).map((row) => ({ id: row.id, type: row.type, title: row.title, detail: row.detail, createdAt: row.created_at })),
    notifications: (notificationsResult.data ?? []).map((row) => ({ id: row.id, category: row.category, title: row.title, body: row.body, readAt: row.read_at, createdAt: row.created_at })),
  };
}

async function profileNames(userIds: string[]) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const names = new Map<string, string>();
  if (uniqueIds.length === 0) return names;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("profiles").select("id, name").in("id", uniqueIds);
  if (error) throw error;
  (data ?? []).forEach((profile) => names.set(profile.id, profile.name));
  return names;
}

import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { findSupabaseWorkspaceByEmail } from "@/lib/supabase/workspace";
import { normalizePrimaryNavigation } from "@/lib/interface-preferences";
import {
  getSupabaseApprovalsData,
  getSupabaseAgendaData,
  getSupabaseClientDetail,
  getSupabaseClientsData,
  getSupabaseDashboardData,
  getSupabaseFilesData,
  getSupabaseNotificationsData,
  getSupabaseProjectApprovals,
  getSupabaseProjectDetail,
  getSupabaseProjectsData,
  getSupabaseTasksData,
  getSupabaseTicketDetail,
  getSupabaseTicketsData,
  getSupabaseUnreadNotificationCount,
} from "@/lib/supabase/workspace-data";
import {
  activities,
  approvals,
  clients,
  files,
  memberships,
  notifications,
  organizations,
  projects,
  supportTickets,
  tasks,
  ticketMessages,
  users,
} from "@/db/schema";

export async function findWorkspaceByEmail(email: string) {
  if (isSupabaseConfigured()) return findSupabaseWorkspaceByEmail(email);

  const db = getDb();
  const [workspace] = await db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userLocale: users.locale,
      bio: users.bio,
      jobTitle: users.jobTitle,
      phone: users.phone,
      location: users.location,
      website: users.website,
      theme: users.theme,
      accentColor: users.accentColor,
      interfaceFilter: users.interfaceFilter,
      colorVisionMode: users.colorVisionMode,
      sidebarMode: users.sidebarMode,
      interfaceDensity: users.interfaceDensity,
      contentWidth: users.contentWidth,
      cornerStyle: users.cornerStyle,
      textScale: users.textScale,
      motionMode: users.motionMode,
      primaryNavigation: users.primaryNavigation,
      organizationId: organizations.id,
      organizationName: organizations.name,
      organizationSlug: organizations.slug,
      plan: organizations.plan,
      organizationBrandColor: organizations.brandColor,
      organizationVisualStyle: organizations.visualStyle,
      role: memberships.role,
    })
    .from(users)
    .innerJoin(memberships, eq(memberships.userId, users.id))
    .innerJoin(organizations, eq(organizations.id, memberships.organizationId))
    .where(
      and(
        eq(users.email, email.toLowerCase()),
        eq(users.status, "active"),
        eq(memberships.status, "active"),
        eq(organizations.status, "active"),
      ),
    )
    .limit(1);

  return workspace ? {
    ...workspace,
    avatarPath: null,
    avatarUrl: null,
    theme: workspace.theme,
    primaryNavigation: normalizePrimaryNavigation(workspace.primaryNavigation),
  } : null;
}

export async function getClientsData(organizationId: string) {
  if (isSupabaseConfigured()) return getSupabaseClientsData(organizationId);
  const db = getDb();
  return db
    .select({
      id: clients.id,
      name: clients.name,
      email: clients.email,
      company: clients.company,
      status: clients.status,
      isDemo: clients.isDemo,
      createdAt: clients.createdAt,
      projectCount: sql<number>`count(${projects.id})`,
    })
    .from(clients)
    .leftJoin(
      projects,
      and(
        eq(projects.clientId, clients.id),
        eq(projects.organizationId, organizationId),
      ),
    )
    .where(eq(clients.organizationId, organizationId))
    .groupBy(clients.id)
    .orderBy(desc(clients.createdAt));
}

export async function getProjectsData(organizationId: string) {
  if (isSupabaseConfigured()) return getSupabaseProjectsData(organizationId);
  const db = getDb();
  return db
    .select({
      id: projects.id,
      clientId: projects.clientId,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      progress: projects.progress,
      dueDate: projects.dueDate,
      isDemo: projects.isDemo,
      clientName: clients.name,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .leftJoin(clients, eq(clients.id, projects.clientId))
    .where(eq(projects.organizationId, organizationId))
    .orderBy(desc(projects.createdAt));
}

export async function getClientDetail(organizationId: string, clientId: string) {
  if (isSupabaseConfigured()) return getSupabaseClientDetail(organizationId, clientId);
  const db = getDb();
  const [client] = await db.select({ id: clients.id, name: clients.name, email: clients.email, company: clients.company, status: clients.status, isDemo: clients.isDemo, createdAt: clients.createdAt })
    .from(clients).where(and(eq(clients.id, clientId), eq(clients.organizationId, organizationId))).limit(1);
  if (!client) return null;
  const clientProjects = await db.select({ id: projects.id, name: projects.name, description: projects.description, status: projects.status, progress: projects.progress, dueDate: projects.dueDate, isDemo: projects.isDemo, createdAt: projects.createdAt })
    .from(projects).where(and(eq(projects.clientId, clientId), eq(projects.organizationId, organizationId))).orderBy(desc(projects.createdAt));
  return { client, projects: clientProjects };
}

export async function getProjectDetail(organizationId: string, projectId: string) {
  if (isSupabaseConfigured()) return getSupabaseProjectDetail(organizationId, projectId);
  const db = getDb();
  const [project] = await db.select({ id: projects.id, name: projects.name, description: projects.description, status: projects.status, progress: projects.progress, dueDate: projects.dueDate, isDemo: projects.isDemo, createdAt: projects.createdAt, clientId: clients.id, clientName: clients.name, clientCompany: clients.company })
    .from(projects).leftJoin(clients, eq(clients.id, projects.clientId))
    .where(and(eq(projects.id, projectId), eq(projects.organizationId, organizationId))).limit(1);
  return project ?? null;
}

export async function getTasksData(organizationId: string, projectId?: string) {
  if (isSupabaseConfigured()) return getSupabaseTasksData(organizationId, projectId);
  const db = getDb();
  const ownership = projectId ? and(eq(tasks.organizationId, organizationId), eq(tasks.projectId, projectId)) : eq(tasks.organizationId, organizationId);
  return db.select({ id: tasks.id, title: tasks.title, description: tasks.description, status: tasks.status, priority: tasks.priority, dueDate: tasks.dueDate, completedAt: tasks.completedAt, createdAt: tasks.createdAt, projectId: projects.id, projectName: projects.name, clientName: clients.name })
    .from(tasks).innerJoin(projects, eq(projects.id, tasks.projectId)).leftJoin(clients, eq(clients.id, projects.clientId)).where(ownership).orderBy(desc(tasks.createdAt));
}

export async function getProjectApprovals(organizationId: string, projectId: string) {
  if (isSupabaseConfigured()) return getSupabaseProjectApprovals(organizationId, projectId);
  const db = getDb();
  return db.select({ id: approvals.id, title: approvals.title, description: approvals.description, status: approvals.status, dueDate: approvals.dueDate, decidedAt: approvals.decidedAt, createdAt: approvals.createdAt })
    .from(approvals).where(and(eq(approvals.organizationId, organizationId), eq(approvals.projectId, projectId))).orderBy(desc(approvals.createdAt));
}

export async function getFilesData(organizationId: string, projectId?: string) {
  if (isSupabaseConfigured()) return getSupabaseFilesData(organizationId, projectId);
  const db = getDb();
  const ownership = projectId ? and(eq(files.organizationId, organizationId), eq(files.projectId, projectId), eq(files.status, "available")) : and(eq(files.organizationId, organizationId), eq(files.status, "available"));
  return db.select({ id: files.id, originalName: files.originalName, contentType: files.contentType, sizeBytes: files.sizeBytes, createdAt: files.createdAt, uploadedByUserId: files.uploadedByUserId, uploaderName: users.name, projectId: projects.id, projectName: projects.name })
    .from(files).innerJoin(users, eq(users.id, files.uploadedByUserId)).leftJoin(projects, eq(projects.id, files.projectId)).where(ownership).orderBy(desc(files.createdAt));
}

export async function getTicketsData(organizationId: string) {
  if (isSupabaseConfigured()) return getSupabaseTicketsData(organizationId);
  const db = getDb();
  return db.select({ id: supportTickets.id, protocol: supportTickets.protocol, category: supportTickets.category, priority: supportTickets.priority, subject: supportTickets.subject, status: supportTickets.status, createdAt: supportTickets.createdAt, updatedAt: supportTickets.updatedAt, clientName: clients.name, requesterName: users.name })
    .from(supportTickets).innerJoin(users, eq(users.id, supportTickets.requesterUserId)).leftJoin(clients, eq(clients.id, supportTickets.clientId)).where(eq(supportTickets.organizationId, organizationId)).orderBy(desc(supportTickets.updatedAt));
}

export async function getTicketDetail(organizationId: string, ticketId: string) {
  if (isSupabaseConfigured()) return getSupabaseTicketDetail(organizationId, ticketId);
  const db = getDb();
  const [ticket] = await db.select({ id: supportTickets.id, protocol: supportTickets.protocol, category: supportTickets.category, priority: supportTickets.priority, subject: supportTickets.subject, status: supportTickets.status, createdAt: supportTickets.createdAt, updatedAt: supportTickets.updatedAt, closedAt: supportTickets.closedAt, clientName: clients.name, requesterName: users.name })
    .from(supportTickets).innerJoin(users, eq(users.id, supportTickets.requesterUserId)).leftJoin(clients, eq(clients.id, supportTickets.clientId))
    .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.organizationId, organizationId))).limit(1);
  if (!ticket) return null;
  const messages = await db.select({ id: ticketMessages.id, body: ticketMessages.body, createdAt: ticketMessages.createdAt, authorUserId: ticketMessages.authorUserId, authorName: users.name })
    .from(ticketMessages).innerJoin(users, eq(users.id, ticketMessages.authorUserId))
    .where(and(eq(ticketMessages.ticketId, ticketId), eq(ticketMessages.organizationId, organizationId), eq(ticketMessages.isInternal, false))).orderBy(ticketMessages.createdAt);
  return { ticket, messages, attachments: [] };
}

export async function getApprovalsData(organizationId: string) {
  if (isSupabaseConfigured()) return getSupabaseApprovalsData(organizationId);
  const db = getDb();
  return db
    .select({
      id: approvals.id,
      title: approvals.title,
      description: approvals.description,
      status: approvals.status,
      dueDate: approvals.dueDate,
      decidedAt: approvals.decidedAt,
      createdAt: approvals.createdAt,
      projectId: approvals.projectId,
      projectName: projects.name,
      clientName: clients.name,
    })
    .from(approvals)
    .innerJoin(projects, eq(projects.id, approvals.projectId))
    .leftJoin(clients, eq(clients.id, projects.clientId))
    .where(eq(approvals.organizationId, organizationId))
    .orderBy(desc(approvals.createdAt));
}

export async function getNotificationsData(
  organizationId: string,
  userId: string,
) {
  if (isSupabaseConfigured()) return getSupabaseNotificationsData(organizationId, userId);
  const db = getDb();
  return db
    .select({
      id: notifications.id,
      category: notifications.category,
      title: notifications.title,
      body: notifications.body,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(
      and(
        eq(notifications.organizationId, organizationId),
        eq(notifications.userId, userId),
      ),
    )
    .orderBy(desc(notifications.createdAt));
}

export async function getUnreadNotificationCount(userId: string) {
  if (isSupabaseConfigured()) return getSupabaseUnreadNotificationCount(userId);
  const db = getDb();
  const [total] = await db
    .select({ value: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        sql`${notifications.readAt} is null`,
      ),
    );
  return Number(total?.value ?? 0);
}

export async function getDashboardData(organizationId: string, userId: string) {
  if (isSupabaseConfigured()) return getSupabaseDashboardData(organizationId, userId);
  const db = getDb();

  const [clientTotal] = await db
    .select({ value: sql<number>`count(*)` })
    .from(clients)
    .where(and(eq(clients.organizationId, organizationId), eq(clients.status, "active")));

  const [projectTotal] = await db
    .select({ value: sql<number>`count(*)` })
    .from(projects)
    .where(and(eq(projects.organizationId, organizationId), eq(projects.status, "active")));

  const [unreadTotal] = await db
    .select({ value: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), sql`${notifications.readAt} is null`));

  const recentProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      progress: projects.progress,
      dueDate: projects.dueDate,
      isDemo: projects.isDemo,
      clientName: clients.name,
    })
    .from(projects)
    .leftJoin(clients, eq(clients.id, projects.clientId))
    .where(eq(projects.organizationId, organizationId))
    .orderBy(desc(projects.createdAt))
    .limit(8);

  const recentActivities = await db
    .select({
      id: activities.id,
      type: activities.type,
      title: activities.title,
      detail: activities.detail,
      createdAt: activities.createdAt,
    })
    .from(activities)
    .where(eq(activities.organizationId, organizationId))
    .orderBy(desc(activities.createdAt))
    .limit(6);

  const recentNotifications = await db
    .select({
      id: notifications.id,
      category: notifications.category,
      title: notifications.title,
      body: notifications.body,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(5);

  return {
    metrics: {
      clients: Number(clientTotal?.value ?? 0),
      projects: Number(projectTotal?.value ?? 0),
      unread: Number(unreadTotal?.value ?? 0),
      approvalRate: 78,
    },
    projects: recentProjects,
    activities: recentActivities,
    notifications: recentNotifications,
  };
}

export async function getAgendaData(organizationId: string) {
  if (isSupabaseConfigured()) return getSupabaseAgendaData(organizationId);
  const { buildAgendaEvents } = await import("@/lib/marco23");
  const [taskItems, approvalItems, projectItems] = await Promise.all([
    getTasksData(organizationId),
    getApprovalsData(organizationId),
    getProjectsData(organizationId),
  ]);
  return buildAgendaEvents({ tasks: taskItems, approvals: approvalItems, projects: projectItems });
}

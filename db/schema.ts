import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Prismivo's first persistent domain model.
 *
 * Every business record carries an organization id. This is the foundation of
 * tenant isolation: API handlers never accept an organization id from the
 * browser as proof of ownership; they resolve it from the authenticated member.
 */
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    locale: text("locale").notNull().default("pt-BR"),
    bio: text("bio").notNull().default(""),
    jobTitle: text("job_title").notNull().default(""),
    phone: text("phone").notNull().default(""),
    location: text("location").notNull().default(""),
    website: text("website").notNull().default(""),
    theme: text("theme").notNull().default("system"),
    accentColor: text("accent_color").notNull().default("lime"),
    interfaceFilter: text("interface_filter").notNull().default("none"),
    colorVisionMode: text("color_vision_mode").notNull().default("standard"),
    sidebarMode: text("sidebar_mode").notNull().default("adaptive"),
    interfaceDensity: text("interface_density").notNull().default("comfortable"),
    contentWidth: text("content_width").notNull().default("standard"),
    cornerStyle: text("corner_style").notNull().default("rounded"),
    textScale: text("text_scale").notNull().default("default"),
    motionMode: text("motion_mode").notNull().default("system"),
    primaryNavigation: text("primary_navigation").notNull().default("dashboard,tasks,projects,clients"),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const organizations = sqliteTable(
  "organizations",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    industry: text("industry").notNull(),
    teamSize: text("team_size").notNull(),
    plan: text("plan").notNull().default("free"),
    brandColor: text("brand_color").notNull().default("lime"),
    visualStyle: text("visual_style").notNull().default("prism"),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("organizations_slug_unique").on(table.slug)],
);

export const memberships = sqliteTable(
  "memberships",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("owner"),
    status: text("status").notNull().default("active"),
    joinedAt: text("joined_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("memberships_user_org_unique").on(
      table.userId,
      table.organizationId,
    ),
    index("memberships_organization_idx").on(table.organizationId),
  ],
);

export const clients = sqliteTable(
  "clients",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    company: text("company"),
    status: text("status").notNull().default("active"),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("clients_organization_idx").on(table.organizationId),
    index("clients_org_status_idx").on(table.organizationId, table.status),
  ],
);

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("active"),
    progress: integer("progress").notNull().default(0),
    dueDate: text("due_date"),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("projects_organization_idx").on(table.organizationId),
    index("projects_org_status_idx").on(table.organizationId, table.status),
    index("projects_client_idx").on(table.clientId),
  ],
);

/**
 * Approval requests keep the decision trail attached to the right project.
 * The organization id is intentionally duplicated here so every query can
 * enforce tenant ownership without trusting identifiers sent by the browser.
 */
export const approvals = sqliteTable(
  "approvals",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("pending"),
    dueDate: text("due_date"),
    decidedByUserId: text("decided_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    decidedAt: text("decided_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("approvals_organization_idx").on(table.organizationId),
    index("approvals_project_idx").on(table.projectId),
    index("approvals_org_status_idx").on(
      table.organizationId,
      table.status,
    ),
  ],
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    assigneeUserId: text("assignee_user_id").references(() => users.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("todo"),
    priority: text("priority").notNull().default("medium"),
    dueDate: text("due_date"),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("tasks_organization_idx").on(table.organizationId),
    index("tasks_project_idx").on(table.projectId),
    index("tasks_org_status_idx").on(table.organizationId, table.status),
    index("tasks_assignee_idx").on(table.assigneeUserId),
  ],
);

export const files = sqliteTable(
  "files",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    uploadedByUserId: text("uploaded_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    storageKey: text("storage_key").notNull(),
    originalName: text("original_name").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    status: text("status").notNull().default("available"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    uniqueIndex("files_storage_key_unique").on(table.storageKey),
    index("files_organization_idx").on(table.organizationId),
    index("files_project_idx").on(table.projectId),
    index("files_org_status_idx").on(table.organizationId, table.status),
  ],
);

export const supportTickets = sqliteTable(
  "support_tickets",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    requesterUserId: text("requester_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
    protocol: text("protocol").notNull(),
    category: text("category").notNull(),
    priority: text("priority").notNull().default("normal"),
    subject: text("subject").notNull(),
    status: text("status").notNull().default("open"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    closedAt: text("closed_at"),
  },
  (table) => [
    uniqueIndex("support_tickets_protocol_unique").on(table.protocol),
    index("support_tickets_organization_idx").on(table.organizationId),
    index("support_tickets_org_status_idx").on(table.organizationId, table.status),
    index("support_tickets_requester_idx").on(table.requesterUserId),
  ],
);

export const ticketMessages = sqliteTable(
  "ticket_messages",
  {
    id: text("id").primaryKey(),
    ticketId: text("ticket_id").notNull().references(() => supportTickets.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    isInternal: integer("is_internal", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("ticket_messages_ticket_created_idx").on(table.ticketId, table.createdAt),
    index("ticket_messages_organization_idx").on(table.organizationId),
  ],
);

export const activities = sqliteTable(
  "activities",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    detail: text("detail").notNull().default(""),
    resourceType: text("resource_type"),
    resourceId: text("resource_id"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("activities_org_created_idx").on(
      table.organizationId,
      table.createdAt,
    ),
  ],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    readAt: text("read_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("notifications_user_read_idx").on(table.userId, table.readAt),
    index("notifications_org_created_idx").on(
      table.organizationId,
      table.createdAt,
    ),
  ],
);

export const consents = sqliteTable(
  "consents",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    version: text("version").notNull(),
    accepted: integer("accepted", { mode: "boolean" }).notNull(),
    acceptedAt: text("accepted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("consents_user_type_idx").on(table.userId, table.type),
  ],
);

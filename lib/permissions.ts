export const organizationRoles = ["owner", "admin", "editor", "support", "viewer"] as const;

export type OrganizationRole = (typeof organizationRoles)[number];
export type Permission =
  | "workspace.read"
  | "clients.write"
  | "projects.write"
  | "tasks.write"
  | "approvals.write"
  | "deliverables.write"
  | "comments.write"
  | "files.write"
  | "support.write"
  | "content.write"
  | "billing.manage"
  | "organization.write"
  | "team.manage"
  | "admin.view";

const rolePermissions: Record<OrganizationRole, readonly Permission[]> = {
  owner: [
    "workspace.read",
    "clients.write",
    "projects.write",
    "tasks.write",
    "approvals.write",
    "deliverables.write",
    "comments.write",
    "files.write",
    "support.write",
    "content.write",
    "billing.manage",
    "organization.write",
    "team.manage",
    "admin.view",
  ],
  admin: [
    "workspace.read",
    "clients.write",
    "projects.write",
    "tasks.write",
    "approvals.write",
    "deliverables.write",
    "comments.write",
    "files.write",
    "support.write",
    "content.write",
    "billing.manage",
    "organization.write",
    "team.manage",
    "admin.view",
  ],
  editor: [
    "workspace.read",
    "clients.write",
    "projects.write",
    "tasks.write",
    "approvals.write",
    "deliverables.write",
    "comments.write",
    "files.write",
    "support.write",
    "content.write",
  ],
  support: ["workspace.read", "support.write", "comments.write"],
  viewer: ["workspace.read", "comments.write"],
};

export function isOrganizationRole(value: string): value is OrganizationRole {
  return organizationRoles.includes(value as OrganizationRole);
}

export function hasPermission(role: string, permission: Permission): boolean {
  return isOrganizationRole(role) && rolePermissions[role].includes(permission);
}

export function roleLabel(role: string): string {
  const labels: Record<OrganizationRole, string> = {
    owner: "Proprietário",
    admin: "Administrador",
    editor: "Editor",
    support: "Suporte",
    viewer: "Leitor",
  };
  return isOrganizationRole(role) ? labels[role] : "Membro";
}

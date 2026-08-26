import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check, KeyRound, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { getMarco23Copy } from "@/lib/marco23-i18n";
import { hasPermission, organizationRoles, type OrganizationRole, type Permission } from "@/lib/permissions";
import { getRequestLocale } from "@/lib/site-locale-server";
import { findWorkspaceByEmail, getUnreadNotificationCount } from "@/lib/workspace";
import { AppShell } from "../components/app-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Permissões", description: "Matriz de permissões do Prismivo.", robots: { index: false, follow: false } };

const capabilityPermission: Record<"operate" | "deliver" | "support" | "content" | "manage", Permission> = {
  operate: "clients.write",
  deliver: "deliverables.write",
  support: "support.write",
  content: "content.write",
  manage: "team.manage",
};

export default async function PermissionsPage() {
  const identity = await requireSessionUser("/app/permissoes");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  const [unreadCount, locale] = await Promise.all([getUnreadNotificationCount(workspace.userId), getRequestLocale()]);
  const copy = getMarco23Copy(locale).permissions;
  const role = organizationRoles.includes(workspace.role as OrganizationRole) ? workspace.role as OrganizationRole : "viewer";

  return <AppShell active="permissions" title={copy.navTitle} description={copy.navDescription} workspace={workspace} unreadCount={unreadCount}>
    <section className="app-page-intro permissions-intro"><div><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p></div><div className="current-role-card"><KeyRound aria-hidden="true" /><span><small>{copy.yourRole}</small><strong>{copy.roles[role]}</strong></span></div></section>
    <section className="permission-role-grid" aria-label={copy.navDescription}>
      {organizationRoles.map((candidate) => <article className={`dashboard-panel permission-role-card${candidate === role ? " current" : ""}`} key={candidate}>
        <header><span><ShieldCheck aria-hidden="true" /></span><div><small>{candidate === role ? copy.yourRole : "PRISMIVO RBAC"}</small><h2>{copy.roles[candidate]}</h2></div></header>
        <ul>{(Object.keys(capabilityPermission) as Array<keyof typeof capabilityPermission>).map((capability) => {
          const allowed = hasPermission(candidate, capabilityPermission[capability]);
          const [title, detail] = copy.capabilities[capability];
          return <li className={allowed ? "allowed" : "restricted"} key={capability}><span>{allowed ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}</span><div><strong>{title}</strong><small>{detail}</small></div><em>{allowed ? copy.allowed : copy.restricted}</em></li>;
        })}</ul>
      </article>)}
    </section>
    <aside className="permission-security-note"><LockKeyhole aria-hidden="true" /><p>{copy.note}</p></aside>
  </AppShell>;
}

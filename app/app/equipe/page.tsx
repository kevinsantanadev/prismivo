import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSessionUser } from "@/app/session-auth";
import { hasPermission } from "@/lib/permissions";
import { getManagementCopy } from "@/lib/app-management-i18n";
import { getRequestLocale } from "@/lib/site-locale-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getTeamData } from "@/lib/supabase/team";
import { findWorkspaceByEmail, getUnreadNotificationCount } from "@/lib/workspace";
import { AppShell } from "../components/app-shell";
import { TeamManager } from "../components/team-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Equipe", description: "Papéis e acessos da organização.", robots: { index: false, follow: false } };

export default async function TeamPage() {
  const locale = await getRequestLocale();
  const copy = getManagementCopy(locale).team;
  const identity = await requireSessionUser("/app/equipe");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  if (!isSupabaseConfigured() || !hasPermission(workspace.role, "team.manage")) redirect("/app");
  const [unreadCount, team] = await Promise.all([getUnreadNotificationCount(workspace.userId), getTeamData(workspace.organizationId)]);
  return <AppShell active="team" title={copy.navTitle} description={copy.navDescription} workspace={workspace} unreadCount={unreadCount}>
    <section className="app-page-intro compact-intro"><div><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p></div></section>
    <TeamManager locale={locale} members={team.members} invitations={team.invitations} currentUserId={workspace.userId} currentRole={workspace.role} />
  </AppShell>;
}

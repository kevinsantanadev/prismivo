import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSessionUser } from "@/app/session-auth";
import { hasPermission } from "@/lib/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getTeamData } from "@/lib/supabase/team";
import { findWorkspaceByEmail, getUnreadNotificationCount } from "@/lib/workspace";
import { AppShell } from "../components/app-shell";
import { TeamManager } from "../components/team-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Equipe", description: "Papéis e acessos da organização.", robots: { index: false, follow: false } };

export default async function TeamPage() {
  const identity = await requireSessionUser("/app/equipe");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  if (!isSupabaseConfigured() || !hasPermission(workspace.role, "team.manage")) redirect("/app");
  const [unreadCount, team] = await Promise.all([getUnreadNotificationCount(workspace.userId), getTeamData(workspace.organizationId)]);
  return <AppShell active="team" title="Equipe" description="Papéis, convites e acessos" workspace={workspace} unreadCount={unreadCount}>
    <section className="app-page-intro compact-intro"><div><span className="eyebrow">MARCO 5 · COLABORAÇÃO</span><h1>As pessoas certas, com o acesso certo.</h1><p>Convites expiram, papéis são validados no servidor e a organização nunca fica sem proprietário ativo.</p></div></section>
    <TeamManager members={team.members} invitations={team.invitations} currentUserId={workspace.userId} currentRole={workspace.role} />
  </AppShell>;
}

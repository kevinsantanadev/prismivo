import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Activity, BadgeCheck, FolderKanban, Headphones, ShieldCheck, Users } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { hasPermission } from "@/lib/permissions";
import { getAdministrationOverview } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { findWorkspaceByEmail, getUnreadNotificationCount } from "@/lib/workspace";
import { AppShell } from "../components/app-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administração", description: "Indicadores e auditoria operacional da organização.", robots: { index: false, follow: false } };

export default async function AdministrationPage() {
  const identity = await requireSessionUser("/app/administracao");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  if (!isSupabaseConfigured() || !hasPermission(workspace.role, "admin.view")) redirect("/app");
  const [unreadCount, overview] = await Promise.all([
    getUnreadNotificationCount(workspace.userId),
    getAdministrationOverview(workspace.organizationId),
  ]);
  const cards = [
    ["Membros ativos", overview.metrics.members, Users],
    ["Clientes ativos", overview.metrics.clients, BadgeCheck],
    ["Projetos ativos", overview.metrics.projects, FolderKanban],
    ["Atendimentos abertos", overview.metrics.openTickets, Headphones],
    ["Aprovações pendentes", overview.metrics.pendingApprovals, ShieldCheck],
  ] as const;
  return <AppShell active="admin" title="Administração" description="Indicadores e auditoria" workspace={workspace} unreadCount={unreadCount}>
    <section className="app-page-intro compact-intro"><div><span className="eyebrow">MARCO 7 · CONTROLE OPERACIONAL</span><h1>Uma visão administrativa sem perder o contexto.</h1><p>Métricas derivadas de dados reais da organização e trilha de atividades protegida por papel.</p></div></section>
    <section className="admin-metrics" aria-label="Indicadores administrativos">{cards.map(([label, value, Icon]) => <article className="dashboard-panel admin-metric" key={label}><Icon aria-hidden="true" /><span>{label}</span><strong>{value}</strong></article>)}</section>
    <section className="dashboard-panel admin-audit" aria-labelledby="audit-title"><div className="panel-heading"><div><span className="panel-kicker">TRILHA RECENTE</span><h2 id="audit-title">Atividade da organização</h2></div><Activity aria-hidden="true" /></div><div className="audit-list">{overview.activities.length === 0 ? <p className="empty-copy">As primeiras ações da equipe aparecerão aqui.</p> : overview.activities.map((item) => <article key={item.id}><span aria-hidden="true" /><div><strong>{item.title}</strong><p>{item.detail}</p><small>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</small></div><code>{item.type}</code></article>)}</div></section>
  </AppShell>;
}

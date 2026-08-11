import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bell, CheckCircle2, FolderKanban, UserRound } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { AppShell } from "../components/app-shell";
import { NotificationActions } from "../components/notification-actions";
import { findWorkspaceByEmail, getNotificationsData, getUnreadNotificationCount } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notificações", description: "Central de notificações do Prismivo.", robots: { index: false, follow: false } };

export default async function NotificationsPage() {
  const identity = await requireSessionUser("/app/notificacoes");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  const [items, unreadCount] = await Promise.all([
    getNotificationsData(workspace.organizationId, workspace.userId),
    getUnreadNotificationCount(workspace.userId),
  ]);

  return (
    <AppShell active="notifications" title="Notificações" description="Atualizações relevantes da sua operação" workspace={workspace} unreadCount={unreadCount}>
      <section className="app-page-intro compact-intro"><div><span className="eyebrow">CENTRAL DE ATUALIZAÇÕES</span><h1>O que merece sua atenção, sem ruído.</h1><p>As notificações respeitam sua conta e o espaço ativo da empresa.</p></div>{unreadCount > 0 && <NotificationActions />}</section>
      <section className="dashboard-panel notification-center" aria-labelledby="notification-center-title">
        <div className="panel-heading"><div><span className="panel-kicker">HISTÓRICO</span><h2 id="notification-center-title">Todas as notificações</h2></div><span className="status-badge">{unreadCount} não lidas</span></div>
        {items.length === 0 ? <div className="empty-state"><Bell aria-hidden="true" /><h3>Tudo em dia</h3><p>Novas atualizações aparecerão aqui.</p></div> : <ul>{items.map((item) => <li key={item.id} className={item.readAt ? "" : "unread"}><span className="notification-category-icon">{categoryIcon(item.category)}</span><div><div className="notification-title-row"><h3>{item.title}</h3>{!item.readAt && <span>NOVA</span>}</div><p>{item.body}</p><small>{formatDate(item.createdAt)}</small></div>{!item.readAt && <NotificationActions notificationId={item.id} />}</li>)}</ul>}
      </section>
    </AppShell>
  );
}

function categoryIcon(category: string) { return category === "project" ? <FolderKanban aria-hidden="true" /> : category === "client" ? <UserRound aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />; }
function formatDate(value: string) { const date = new Date(value.replace(" ", "T") + "Z"); return Number.isNaN(date.getTime()) ? "Agora" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(date); }

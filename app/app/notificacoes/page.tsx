import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bell, CheckCircle2, FolderKanban, UserRound } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";
import { getRequestLocale } from "@/lib/site-locale-server";
import { AppShell } from "../components/app-shell";
import { NotificationActions } from "../components/notification-actions";
import { findWorkspaceByEmail, getNotificationsData, getUnreadNotificationCount } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notificações", description: "Central de notificações do Prismivo.", robots: { index: false, follow: false } };

export default async function NotificationsPage() {
  const identity = await requireSessionUser("/app/notificacoes");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  const [items, unreadCount, locale] = await Promise.all([
    getNotificationsData(workspace.organizationId, workspace.userId),
    getUnreadNotificationCount(workspace.userId),
    getRequestLocale(),
  ]);
  const copy = getOperationalCopy(locale);

  return (
    <AppShell active="notifications" title="Notificações" description="Atualizações relevantes da sua operação" workspace={workspace} unreadCount={unreadCount}>
      <section className="app-page-intro compact-intro"><div><span className="eyebrow">{copy.notifications.eyebrow}</span><h1>{copy.notifications.title}</h1><p>{copy.notifications.intro}</p></div>{unreadCount > 0 && <NotificationActions locale={locale} />}</section>
      <section className="dashboard-panel notification-center" aria-labelledby="notification-center-title">
        <div className="panel-heading"><div><span className="panel-kicker">{copy.notifications.history}</span><h2 id="notification-center-title">{copy.notifications.all}</h2></div><span className="status-badge">{copy.notifications.unread(unreadCount)}</span></div>
        {items.length === 0 ? <div className="empty-state"><Bell aria-hidden="true" /><h3>{copy.notifications.empty}</h3><p>{copy.notifications.emptyDetail}</p></div> : <ul>{items.map((item) => <li key={item.id} className={item.readAt ? "" : "unread"}><span className="notification-category-icon">{categoryIcon(item.category)}</span><div><div className="notification-title-row"><h3>{item.title}</h3>{!item.readAt && <span>{copy.notifications.new}</span>}</div><p>{item.body}</p><small>{formatDate(item.createdAt, locale, copy.common.now)}</small></div>{!item.readAt && <NotificationActions notificationId={item.id} locale={locale} />}</li>)}</ul>}
      </section>
    </AppShell>
  );
}

function categoryIcon(category: string) { return category === "project" ? <FolderKanban aria-hidden="true" /> : category === "client" ? <UserRound aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />; }
function formatDate(value: string, locale: SiteLocale, fallback: string) { const date = new Date(value.replace(" ", "T") + "Z"); return Number.isNaN(date.getTime()) ? fallback : new Intl.DateTimeFormat(toIntlLocale(locale), { dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(date); }

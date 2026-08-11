import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  Bell,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  FolderKanban,
  Sparkles,
  Users,
} from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import { getRequestLocale } from "@/lib/site-locale-server";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";
import { findWorkspaceByEmail, getDashboardData } from "@/lib/workspace";
import { AppShell } from "./components/app-shell";
import { ProjectForm } from "./project-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Painel operacional protegido do Prismivo.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AppDashboardPage() {
  const identity = await requireSessionUser("/app");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");

  const [data, locale] = await Promise.all([
    getDashboardData(workspace.organizationId, workspace.userId),
    getRequestLocale(),
  ]);
  const copy = getOperationalCopy(locale);
  const firstName = workspace.userName.split(" ")[0] || (locale === "en" ? "there" : locale === "es" ? "usuario" : "usuário");

  return (
    <AppShell active="dashboard" title="Visão geral" description="Dados protegidos da sua empresa" workspace={workspace} unreadCount={data.metrics.unread}>
          <section className="app-welcome"><div><span className="eyebrow">{copy.dashboard.eyebrow}</span><h1>{copy.dashboard.greeting(firstName)}</h1><p>{copy.dashboard.intro}</p></div><ProjectForm locale={locale} /></section>

          <section className="app-metrics" id="metricas" aria-label={copy.dashboard.summaryAria}>
            <MetricCard label={copy.dashboard.metrics[0][0]} value={data.metrics.clients} detail={copy.dashboard.metrics[0][1]} icon={<Users />} />
            <MetricCard label={copy.dashboard.metrics[1][0]} value={data.metrics.projects} detail={copy.dashboard.metrics[1][1]} icon={<FolderKanban />} />
            <MetricCard label={copy.dashboard.metrics[2][0]} value={`${data.metrics.approvalRate}%`} detail={copy.dashboard.metrics[2][1]} icon={<FileCheck2 />} />
            <MetricCard label={copy.dashboard.metrics[3][0]} value={data.metrics.unread} detail={copy.dashboard.metrics[3][1]} icon={<Bell />} />
          </section>

          <section className="dashboard-grid">
            <article className="dashboard-panel onboarding-progress">
              <div className="panel-heading"><div><span className="panel-kicker">{copy.dashboard.firstSteps}</span><h2>{copy.dashboard.prepare}</h2></div><strong>{copy.dashboard.stepCount}</strong></div>
              <div className="onboarding-bar"><span /></div>
              <ul><li className="done"><CheckCircle2 aria-hidden="true" /><span><strong>{copy.dashboard.companyCreated}</strong><small>{copy.dashboard.companyCreatedDetail}</small></span></li><li className="done"><CheckCircle2 aria-hidden="true" /><span><strong>{copy.dashboard.meetAurora}</strong><small>{copy.dashboard.meetAuroraDetail}</small></span></li><li><span className="step-dot">3</span><span><strong>{copy.dashboard.createRealProject}</strong><small>{copy.dashboard.createRealProjectDetail}</small></span></li></ul>
            </article>

            <article className="dashboard-panel prismivo-pulse">
              <div className="panel-heading"><div><span className="panel-kicker">{copy.dashboard.pulse}</span><h2>{copy.dashboard.health}</h2></div><Sparkles aria-hidden="true" /></div>
              <div className="pulse-score"><span><strong>84</strong><small>/100</small></span></div>
              <p>{copy.dashboard.pulseText}</p>
              <div className="pulse-tags"><span>{copy.dashboard.highClarity}</span><span>{copy.dashboard.oneSuggestion}</span></div>
            </article>
          </section>

          <section className="dashboard-panel projects-panel">
            <div className="panel-heading"><div><span className="panel-kicker">{copy.dashboard.activePortfolio}</span><h2>{copy.dashboard.recentProjects}</h2></div><Link href="/app/projetos">{copy.dashboard.viewAll}</Link></div>
            {data.projects.length === 0 ? <div className="empty-state"><FolderKanban aria-hidden="true" /><h3>{copy.dashboard.noProjects}</h3><p>{copy.dashboard.noProjectsDetail}</p></div> : <div className="responsive-table"><table><caption className="sr-only">{copy.dashboard.recentProjectsCaption}</caption><thead><tr>{copy.dashboard.table.map((heading) => <th scope="col" key={heading}>{heading}</th>)}</tr></thead><tbody>{data.projects.map((project) => <tr key={project.id}><td><strong>{project.name}</strong>{project.isDemo && <small className="demo-badge">{copy.dashboard.demo}</small>}<span>{project.description || copy.common.noDescription}</span></td><td>{project.clientName ?? copy.common.noClient}</td><td><div className="table-progress" aria-label={copy.dashboard.completed(project.progress)}><span style={{ width: `${project.progress}%` }} /></div><small>{project.progress}%</small></td><td>{formatDate(project.dueDate, locale, copy.dashboard.noDeadline)}</td><td><span className="status-badge">{project.status === "active" ? copy.dashboard.active : project.status}</span></td></tr>)}</tbody></table></div>}
          </section>

          <section className="dashboard-grid lower-grid">
            <article className="dashboard-panel"><div className="panel-heading"><div><span className="panel-kicker">{copy.dashboard.history}</span><h2>{copy.dashboard.recentActivity}</h2></div><Activity aria-hidden="true" /></div><ul className="activity-list">{data.activities.map((activity) => <li key={activity.id}><span className="activity-dot" /><div><strong>{activity.title}</strong><p>{activity.detail}</p><small>{formatTimestamp(activity.createdAt, locale, copy.common.now)}</small></div></li>)}</ul></article>
            <article className="dashboard-panel"><div className="panel-heading"><div><span className="panel-kicker">{copy.dashboard.center}</span><h2>{copy.dashboard.notifications}</h2></div><Bell aria-hidden="true" /></div><ul className="notification-list">{data.notifications.map((notification) => <li key={notification.id} className={!notification.readAt ? "unread" : ""}><span><CircleDollarSign aria-hidden="true" /></span><div><strong>{notification.title}</strong><p>{notification.body}</p></div></li>)}</ul><Link className="panel-text-link" href="/app/notificacoes">{copy.dashboard.openNotifications}</Link></article>
          </section>
    </AppShell>
  );
}

function MetricCard({ label, value, detail, icon }: { label: string; value: string | number; detail: string; icon: React.ReactNode }) {
  return <article><span className="metric-card-icon" aria-hidden="true">{icon}</span><div><small>{label}</small><strong>{value}</strong><span>{detail}</span></div></article>;
}

function formatDate(value: string | null, locale: SiteLocale, fallback: string) {
  if (!value) return fallback;
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat(toIntlLocale(locale), { day: "2-digit", month: "short" }).format(date);
}

function formatTimestamp(value: string, locale: SiteLocale, fallback: string) {
  const date = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(toIntlLocale(locale), { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(date);
}

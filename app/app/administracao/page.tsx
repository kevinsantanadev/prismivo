import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, BadgeCheck, Clock3, Download, FolderKanban, Headphones, Search, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { getManagementCopy } from "@/lib/app-management-i18n";
import { hasPermission } from "@/lib/permissions";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";
import { getRequestLocale } from "@/lib/site-locale-server";
import { getAdministrationOverview } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { adminReportQuerySchema } from "@/lib/validation";
import { findWorkspaceByEmail, getUnreadNotificationCount } from "@/lib/workspace";
import { AppShell } from "../components/app-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administração", description: "Indicadores, relatórios e auditoria operacional da organização.", robots: { index: false, follow: false } };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdministrationPage({ searchParams }: { searchParams: SearchParams }) {
  const locale = await getRequestLocale();
  const copy = getManagementCopy(locale).admin;
  const identity = await requireSessionUser("/app/administracao");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  if (!isSupabaseConfigured() || !hasPermission(workspace.role, "admin.view")) redirect("/app");

  const rawParams = await searchParams;
  const parsed = adminReportQuerySchema.safeParse(firstValues(rawParams));
  const filters = parsed.success ? parsed.data : { period: 30 as const, type: "all", query: "", page: 1 };
  const [unreadCount, overview] = await Promise.all([getUnreadNotificationCount(workspace.userId), getAdministrationOverview(workspace.organizationId, filters)]);
  const cards = [
    [copy.metrics[0], overview.metrics.members, Users],
    [copy.metrics[1], overview.metrics.clients, BadgeCheck],
    [copy.metrics[2], overview.metrics.projects, FolderKanban],
    [copy.metrics[3], overview.metrics.openTickets, Headphones],
    [copy.metrics[4], overview.metrics.pendingApprovals, ShieldCheck],
  ] as const;
  const maxTimelineValue = Math.max(...overview.timeline.map((item) => item.count), 1);
  const exportParams = reportParams(overview.filters);

  return <AppShell active="admin" title={copy.navTitle} description={copy.navDescription} workspace={workspace} unreadCount={unreadCount}>
    <section className="app-page-intro compact-intro"><div><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p></div></section>
    <section className="admin-metrics" aria-label={copy.metricsAria}>{cards.map(([label, value, Icon]) => <article className="dashboard-panel admin-metric" key={label}><Icon aria-hidden="true" /><span>{label}</span><strong>{value}</strong></article>)}</section>

    <section className="admin-report-grid">
      <article className="dashboard-panel admin-activity-chart" aria-labelledby="activity-chart-title">
        <div className="panel-heading"><div><span className="panel-kicker">{copy.lastDays(overview.filters.period)}</span><h2 id="activity-chart-title">{copy.activityVolume}</h2></div><TrendingUp aria-hidden="true" /></div>
        <div className="activity-chart-summary"><strong>{overview.metrics.periodActivities}</strong><span>{copy.actionsRegistered}</span></div>
        <ol className="activity-bars" aria-label={copy.distribution(overview.metrics.periodActivities, overview.filters.period)}>{overview.timeline.map((item) => <li key={item.start}><span className="activity-bar-track"><span style={{ height: item.count === 0 ? "0%" : `${Math.max(8, Math.round((item.count / maxTimelineValue) * 100))}%` }} /></span><strong>{item.count}</strong><small>{formatShortDate(item.start, locale)}</small></li>)}</ol>
      </article>
      <article className="dashboard-panel admin-report-note" aria-labelledby="report-note-title"><div className="panel-heading"><div><span className="panel-kicker">{copy.secureReport}</span><h2 id="report-note-title">{copy.ready}</h2></div><Clock3 aria-hidden="true" /></div><p>{copy.reportText}</p><Link className="app-primary-button" href={`/api/admin/reports?${exportParams}`}><Download aria-hidden="true" />{copy.exportCsv}</Link></article>
    </section>

    <section className="dashboard-panel admin-audit" aria-labelledby="audit-title">
      <div className="panel-heading"><div><span className="panel-kicker">{copy.audit}</span><h2 id="audit-title">{copy.organizationActivity}</h2></div><Activity aria-hidden="true" /></div>
      <form className="admin-report-filters" method="get">
        <div className="form-field"><label htmlFor="admin-period">{copy.period}</label><select id="admin-period" name="period" defaultValue={String(overview.filters.period)}><option value="7">{copy.last7}</option><option value="30">{copy.last30}</option><option value="90">{copy.last90}</option></select></div>
        <div className="form-field"><label htmlFor="admin-type">{copy.type}</label><select id="admin-type" name="type" defaultValue={overview.filters.type}><option value="all">{copy.allTypes}</option>{overview.activityTypes.map((type) => <option value={type} key={type}>{formatActivityType(type, locale)}</option>)}</select></div>
        <div className="form-field admin-search-field"><label htmlFor="admin-query">{copy.search}</label><div><Search aria-hidden="true" /><input id="admin-query" name="query" defaultValue={overview.filters.query} maxLength={100} placeholder={copy.searchPlaceholder} /></div></div>
        <button className="app-primary-button" type="submit">{copy.apply}</button>
      </form>
      <p className="report-result-count" role="status">{copy.result(overview.pagination.total)}</p>
      <div className="audit-list">{overview.activities.length === 0 ? <div className="admin-empty-report"><Search aria-hidden="true" /><strong>{copy.empty}</strong><p>{copy.emptyDetail}</p></div> : overview.activities.map((item) => <article key={item.id}><span aria-hidden="true" /><div><strong>{item.title}</strong><p>{item.detail || copy.noDetail}</p><small>{new Intl.DateTimeFormat(toIntlLocale(locale), { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}{item.resource_type ? ` · ${formatActivityType(item.resource_type, locale)}` : ""}</small></div><code>{formatActivityType(item.type, locale)}</code></article>)}</div>
      {overview.pagination.pageCount > 1 && <nav className="admin-pagination" aria-label={copy.paginationAria}><PageLink label={copy.previous} page={overview.pagination.page - 1} disabled={overview.pagination.page === 1} filters={overview.filters} /><span>{copy.page(overview.pagination.page, overview.pagination.pageCount)}</span><PageLink label={copy.next} page={overview.pagination.page + 1} disabled={overview.pagination.page === overview.pagination.pageCount} filters={overview.filters} /></nav>}
    </section>
  </AppShell>;
}

function PageLink({ label, page, disabled, filters }: { label: string; page: number; disabled: boolean; filters: { period: 7 | 30 | 90; type: string; query: string; page: number } }) {
  if (disabled) return <span aria-disabled="true">{label}</span>;
  return <Link href={`/app/administracao?${reportParams({ ...filters, page })}`}>{label}</Link>;
}

function firstValues(params: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
}

function reportParams(filters: { period: 7 | 30 | 90; type: string; query: string; page: number }) {
  const params = new URLSearchParams({ period: String(filters.period), type: filters.type, query: filters.query });
  if (filters.page > 1) params.set("page", String(filters.page));
  return params.toString();
}

function formatActivityType(value: string, locale: SiteLocale) {
  return value.replace(/[._-]+/g, " ").replace(/\b\p{L}/gu, (character) => character.toLocaleUpperCase(toIntlLocale(locale)));
}

function formatShortDate(value: string, locale: SiteLocale) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), { day: "2-digit", month: "short" }).format(new Date(value));
}

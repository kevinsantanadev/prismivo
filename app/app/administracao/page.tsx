import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, BadgeCheck, Clock3, Download, FolderKanban, Headphones, Search, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { hasPermission } from "@/lib/permissions";
import { getAdministrationOverview } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { adminReportQuerySchema } from "@/lib/validation";
import { findWorkspaceByEmail, getUnreadNotificationCount } from "@/lib/workspace";
import { AppShell } from "../components/app-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administração", description: "Indicadores, relatórios e auditoria operacional da organização.", robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdministrationPage({ searchParams }: { searchParams: SearchParams }) {
  const identity = await requireSessionUser("/app/administracao");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  if (!isSupabaseConfigured() || !hasPermission(workspace.role, "admin.view")) redirect("/app");

  const rawParams = await searchParams;
  const parsed = adminReportQuerySchema.safeParse(firstValues(rawParams));
  const filters = parsed.success ? parsed.data : { period: 30 as const, type: "all", query: "", page: 1 };
  const [unreadCount, overview] = await Promise.all([
    getUnreadNotificationCount(workspace.userId),
    getAdministrationOverview(workspace.organizationId, filters),
  ]);
  const cards = [
    ["Membros ativos", overview.metrics.members, Users],
    ["Clientes ativos", overview.metrics.clients, BadgeCheck],
    ["Projetos ativos", overview.metrics.projects, FolderKanban],
    ["Atendimentos abertos", overview.metrics.openTickets, Headphones],
    ["Aprovações pendentes", overview.metrics.pendingApprovals, ShieldCheck],
  ] as const;
  const maxTimelineValue = Math.max(...overview.timeline.map((item) => item.count), 1);
  const exportParams = reportParams(overview.filters);

  return <AppShell active="admin" title="Administração" description="Indicadores, relatórios e auditoria" workspace={workspace} unreadCount={unreadCount}>
    <section className="app-page-intro compact-intro"><div><span className="eyebrow">MARCO 8 · INTELIGÊNCIA OPERACIONAL</span><h1>Decisões melhores começam com contexto rastreável.</h1><p>Indicadores reais, filtros administrativos e relatórios exportáveis sem romper o isolamento da organização.</p></div></section>
    <section className="admin-metrics" aria-label="Indicadores administrativos">{cards.map(([label, value, Icon]) => <article className="dashboard-panel admin-metric" key={label}><Icon aria-hidden="true" /><span>{label}</span><strong>{value}</strong></article>)}</section>

    <section className="admin-report-grid">
      <article className="dashboard-panel admin-activity-chart" aria-labelledby="activity-chart-title">
        <div className="panel-heading"><div><span className="panel-kicker">ÚLTIMOS {overview.filters.period} DIAS</span><h2 id="activity-chart-title">Volume de atividades</h2></div><TrendingUp aria-hidden="true" /></div>
        <div className="activity-chart-summary"><strong>{overview.metrics.periodActivities}</strong><span>ações registradas no período</span></div>
        <ol className="activity-bars" aria-label={`Distribuição de ${overview.metrics.periodActivities} atividades nos últimos ${overview.filters.period} dias`}>
          {overview.timeline.map((item) => <li key={item.start}><span className="activity-bar-track"><span style={{ height: item.count === 0 ? "0%" : `${Math.max(8, Math.round((item.count / maxTimelineValue) * 100))}%` }} /></span><strong>{item.count}</strong><small>{formatShortDate(item.start)}</small></li>)}
        </ol>
      </article>
      <article className="dashboard-panel admin-report-note" aria-labelledby="report-note-title"><div className="panel-heading"><div><span className="panel-kicker">RELATÓRIO SEGURO</span><h2 id="report-note-title">Pronto para análise</h2></div><Clock3 aria-hidden="true" /></div><p>O arquivo respeita os mesmos filtros desta tela, limita o volume exportado e protege células contra fórmulas maliciosas.</p><Link className="app-primary-button" href={`/api/admin/reports?${exportParams}`}><Download aria-hidden="true" />Exportar CSV</Link></article>
    </section>

    <section className="dashboard-panel admin-audit" aria-labelledby="audit-title">
      <div className="panel-heading"><div><span className="panel-kicker">AUDITORIA OPERACIONAL</span><h2 id="audit-title">Atividade da organização</h2></div><Activity aria-hidden="true" /></div>
      <form className="admin-report-filters" method="get">
        <div className="form-field"><label htmlFor="admin-period">Período</label><select id="admin-period" name="period" defaultValue={String(overview.filters.period)}><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option></select></div>
        <div className="form-field"><label htmlFor="admin-type">Tipo</label><select id="admin-type" name="type" defaultValue={overview.filters.type}><option value="all">Todos os tipos</option>{overview.activityTypes.map((type) => <option value={type} key={type}>{formatActivityType(type)}</option>)}</select></div>
        <div className="form-field admin-search-field"><label htmlFor="admin-query">Buscar na trilha</label><div><Search aria-hidden="true" /><input id="admin-query" name="query" defaultValue={overview.filters.query} maxLength={100} placeholder="Título, detalhe ou recurso" /></div></div>
        <button className="app-primary-button" type="submit">Aplicar filtros</button>
      </form>
      <p className="report-result-count" role="status">{overview.pagination.total} {overview.pagination.total === 1 ? "registro encontrado" : "registros encontrados"}.</p>
      <div className="audit-list">{overview.activities.length === 0 ? <div className="admin-empty-report"><Search aria-hidden="true" /><strong>Nenhuma atividade corresponde aos filtros.</strong><p>Altere o período ou limpe a busca para ampliar os resultados.</p></div> : overview.activities.map((item) => <article key={item.id}><span aria-hidden="true" /><div><strong>{item.title}</strong><p>{item.detail || "Ação registrada sem detalhe adicional."}</p><small>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}{item.resource_type ? ` · ${formatActivityType(item.resource_type)}` : ""}</small></div><code>{formatActivityType(item.type)}</code></article>)}</div>
      {overview.pagination.pageCount > 1 && <nav className="admin-pagination" aria-label="Paginação da auditoria"><PageLink label="Anterior" page={overview.pagination.page - 1} disabled={overview.pagination.page === 1} filters={overview.filters} /><span>Página {overview.pagination.page} de {overview.pagination.pageCount}</span><PageLink label="Próxima" page={overview.pagination.page + 1} disabled={overview.pagination.page === overview.pagination.pageCount} filters={overview.filters} /></nav>}
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

function formatActivityType(value: string) {
  return value.replace(/[._-]+/g, " ").replace(/\b\p{L}/gu, (character) => character.toLocaleUpperCase("pt-BR"));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
}

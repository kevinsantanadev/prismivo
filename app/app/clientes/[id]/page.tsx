import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Activity, ArrowLeft, BriefcaseBusiness, Building2, CalendarDays, Gauge, Mail, TriangleAlert } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import { deriveClientInsights } from "@/lib/marco23";
import { getMarco23Copy } from "@/lib/marco23-i18n";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";
import { getRequestLocale } from "@/lib/site-locale-server";
import { findWorkspaceByEmail, getClientDetail, getUnreadNotificationCount } from "@/lib/workspace";
import { AppShell } from "../../components/app-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Detalhes do cliente", description: "Contexto protegido do cliente no Prismivo.", robots: { index: false, follow: false } };

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const identity = await requireSessionUser(`/app/clientes/${id}`);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  const [detail, unreadCount, locale] = await Promise.all([
    getClientDetail(workspace.organizationId, id),
    getUnreadNotificationCount(workspace.userId),
    getRequestLocale(),
  ]);
  if (!detail) notFound();
  const copy = getOperationalCopy(locale);
  const crm = getMarco23Copy(locale).crm;
  const insight = deriveClientInsights(
    [{ id: detail.client.id, status: detail.client.status }],
    detail.projects.map((project) => ({ ...project, clientId: detail.client.id })),
  )[0];

  return (
    <AppShell active="clients" title={detail.client.name} description="Cliente e projetos vinculados" workspace={workspace} unreadCount={unreadCount}>
      <Link className="detail-back" href="/app/clientes"><ArrowLeft aria-hidden="true" />{copy.clients.back}</Link>
      <section className="detail-hero">
        <div><span className="eyebrow">{copy.clients.protectedRelationship}</span><h1>{detail.client.name}</h1><p>{detail.client.company || copy.clients.independent}</p></div>
        <span className={`status-badge ${detail.client.status}`}>{detail.client.status === "active" ? copy.clients.active : detail.client.status}</span>
      </section>
      <section className="detail-info-grid" aria-label={copy.clients.infoAria}>
        <article><Building2 aria-hidden="true" /><span><small>{copy.clients.company}</small><strong>{detail.client.company || copy.clients.notProvidedFeminine}</strong></span></article>
        <article><Mail aria-hidden="true" /><span><small>{copy.clients.email}</small><strong>{detail.client.email || copy.clients.notProvidedMasculine}</strong></span></article>
        <article><CalendarDays aria-hidden="true" /><span><small>{copy.clients.since}</small><strong>{formatDate(detail.client.createdAt, locale)}</strong></span></article>
        <article><BriefcaseBusiness aria-hidden="true" /><span><small>{copy.clients.projects}</small><strong>{detail.projects.length}</strong></span></article>
      </section>
      <section className="dashboard-panel crm-relationship-panel" aria-labelledby="crm-relationship-title">
        <div className="panel-heading"><div><span className="panel-kicker">{crm.portfolioHealth}</span><h2 id="crm-relationship-title">{crm.relationshipOverview}</h2></div><span className={`crm-health ${insight.health}`}>{crm[insight.health]}</span></div>
        <p>{crm.relationshipDetail}</p>
        <div className="crm-insight-grid">
          <article><Activity aria-hidden="true" /><span><strong>{insight.activeProjects}</strong><small>{crm.activeProjects}</small></span></article>
          <article><Gauge aria-hidden="true" /><span><strong>{insight.averageProgress}%</strong><small>{crm.averageProgress}</small></span></article>
          <article><TriangleAlert aria-hidden="true" /><span><strong>{insight.overdueProjects}</strong><small>{crm.overdue}</small></span></article>
          <article><CalendarDays aria-hidden="true" /><span><strong>{insight.nextDeadline ? formatShortDate(insight.nextDeadline, locale) : "—"}</strong><small>{crm.nextDeadline}</small></span></article>
        </div>
      </section>
      <section className="dashboard-panel detail-section" aria-labelledby="client-projects-title">
        <div className="section-mini-heading"><span className="panel-kicker">{copy.clients.linkedWork}</span><h2 id="client-projects-title">{copy.clients.clientProjects}</h2></div>
        {detail.projects.length === 0 ? (
          <div className="empty-state"><BriefcaseBusiness aria-hidden="true" /><h3>{copy.clients.noLinked}</h3><p>{copy.clients.noLinkedDetail}</p></div>
        ) : (
          <div className="detail-project-grid">{detail.projects.map((project) => (
            <Link href={`/app/projetos/${project.id}`} key={project.id}>
              <span className={`status-badge ${project.status}`}>{project.status === "completed" ? copy.clients.completed : copy.clients.active}</span>
              <h3>{project.name}</h3>
              <p>{project.description || copy.common.noDescription}</p>
              <small>{copy.clients.progress(project.progress)} · {project.dueDate ? copy.clients.deadline(formatShortDate(project.dueDate, locale)) : copy.clients.noDeadline}</small>
            </Link>
          ))}</div>
        )}
      </section>
    </AppShell>
  );
}

function formatDate(value: string, locale: SiteLocale) {
  const date = new Date(value.replace(" ", "T") + "Z");
  return new Intl.DateTimeFormat(toIntlLocale(locale), { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(date);
}

function formatShortDate(value: string, locale: SiteLocale) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

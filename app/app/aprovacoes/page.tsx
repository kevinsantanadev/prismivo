import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, FileCheck2, RotateCcw } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";
import { getRequestLocale } from "@/lib/site-locale-server";
import { AppShell } from "../components/app-shell";
import { ApprovalActions } from "../components/approval-actions";
import { ApprovalForm } from "../components/approval-form";
import { findWorkspaceByEmail, getApprovalsData, getProjectsData, getUnreadNotificationCount } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Aprovações", description: "Decisões rastreáveis do Prismivo.", robots: { index: false, follow: false } };

export default async function ApprovalsPage() {
  const identity = await requireSessionUser("/app/aprovacoes");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  const [items, projects, unreadCount, locale] = await Promise.all([
    getApprovalsData(workspace.organizationId),
    getProjectsData(workspace.organizationId),
    getUnreadNotificationCount(workspace.userId),
    getRequestLocale(),
  ]);
  const copy = getOperationalCopy(locale);
  const pending = items.filter((item) => item.status === "pending").length;
  const approved = items.filter((item) => item.status === "approved").length;
  const changes = items.filter((item) => item.status === "changes_requested").length;

  return (
    <AppShell active="approvals" title="Aprovações" description="Decisões registradas e vinculadas ao projeto" workspace={workspace} unreadCount={unreadCount}>
      <section className="app-page-intro"><div><span className="eyebrow">{copy.approvals.eyebrow}</span><h1>{copy.approvals.title}</h1><p>{copy.approvals.intro}</p></div><ApprovalForm locale={locale} projects={projects.map(({ id, name, clientName }) => ({ id, name, clientName }))} /></section>
      <section className="app-summary-strip" aria-label={copy.approvals.summaryAria}><article><Clock3 aria-hidden="true" /><span><strong>{pending}</strong><small>{copy.approvals.pendingCount}</small></span></article><article><CheckCircle2 aria-hidden="true" /><span><strong>{approved}</strong><small>{copy.approvals.approvedCount}</small></span></article><article><RotateCcw aria-hidden="true" /><span><strong>{changes}</strong><small>{copy.approvals.changesCount}</small></span></article></section>
      <section className="approval-list" aria-labelledby="approval-list-title">
        <div className="section-mini-heading"><span className="panel-kicker">{copy.approvals.history}</span><h2 id="approval-list-title">{copy.approvals.requests}</h2></div>
        {items.length === 0 ? <div className="dashboard-panel empty-state"><FileCheck2 aria-hidden="true" /><h3>{copy.approvals.empty}</h3><p>{copy.approvals.emptyDetail}</p></div> : items.map((item) => (
          <article className="dashboard-panel approval-card" key={item.id}>
            <div className="approval-card-icon"><FileCheck2 aria-hidden="true" /></div>
            <div className="approval-card-body"><div className="approval-card-meta"><span>{item.projectName}</span><small>{item.clientName || copy.common.noClient}</small></div><h3>{item.title}</h3><p>{item.description || copy.approvals.noNotes}</p><small>{copy.approvals.createdAt(formatDate(item.createdAt, locale, copy.common.now))}{item.dueDate ? ` · ${copy.approvals.deadline(formatShortDate(item.dueDate, locale))}` : ""}</small></div>
            <div className="approval-card-status"><span className={`approval-status ${item.status}`}>{statusLabel(item.status, locale)}</span>{item.status === "pending" ? <ApprovalActions id={item.id} locale={locale} /> : <small>{copy.approvals.decisionRecorded(item.decidedAt ? formatDate(item.decidedAt, locale, copy.common.now) : undefined)}</small>}</div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}

function statusLabel(status: string, locale: SiteLocale) { const labels = getOperationalCopy(locale).approvals.statuses; return status === "approved" ? labels.approved : status === "changes_requested" ? labels.changes : labels.pending; }
function formatDate(value: string, locale: SiteLocale, fallback: string) { const date = new Date(value.replace(" ", "T") + "Z"); return Number.isNaN(date.getTime()) ? fallback : new Intl.DateTimeFormat(toIntlLocale(locale), { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(date); }
function formatShortDate(value: string, locale: SiteLocale) { return new Intl.DateTimeFormat(toIntlLocale(locale), { day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`)); }

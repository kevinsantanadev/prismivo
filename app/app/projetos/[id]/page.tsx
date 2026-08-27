import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, Download, FileCheck2, Files, ListChecks } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import { hasPermission } from "@/lib/permissions";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";
import { getRequestLocale } from "@/lib/site-locale-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProjectDeliverables } from "@/lib/supabase/deliverables";
import { findWorkspaceByEmail, getFilesData, getProjectApprovals, getProjectDetail, getTasksData, getUnreadNotificationCount } from "@/lib/workspace";
import { AppShell } from "../../components/app-shell";
import { FileDelete } from "../../components/file-delete";
import { FileUpload } from "../../components/file-upload";
import { ProjectDeliverables } from "../../components/project-deliverables";
import { ProjectLifecycleActions } from "../../components/project-lifecycle-actions";
import { ProjectProgress } from "../../components/project-progress";
import { TaskForm } from "../../components/task-form";
import { TaskStatusActions } from "../../components/task-status-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Detalhes do projeto", description: "Execução protegida do projeto no Prismivo.", robots: { index: false, follow: false } };

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const identity = await requireSessionUser(`/app/projetos/${id}`);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");

  const [project, tasks, approvals, files, deliverables, unreadCount, locale] = await Promise.all([
    getProjectDetail(workspace.organizationId, id),
    getTasksData(workspace.organizationId, id),
    getProjectApprovals(workspace.organizationId, id),
    getFilesData(workspace.organizationId, id),
    isSupabaseConfigured() ? getProjectDeliverables(workspace.organizationId, id) : Promise.resolve([]),
    getUnreadNotificationCount(workspace.userId),
    getRequestLocale(),
  ]);
  if (!project) notFound();
  const copy = getOperationalCopy(locale);
  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const pendingApprovals = approvals.filter((approval) => approval.status === "pending").length;
  const archived = project.status === "archived";

  return <AppShell active="projects" title={project.name} description="Central operacional do projeto" workspace={workspace} unreadCount={unreadCount}>
    <Link className="detail-back" href="/app/projetos"><ArrowLeft aria-hidden="true" />{copy.projects.detail.back}</Link>
    <section className="detail-hero project-detail-hero">
      <div><span className="eyebrow">{copy.projects.detail.eyebrow}</span><h1>{project.name}</h1><p>{project.description || copy.projects.detail.noDescription}</p><div className="detail-inline-meta"><span>{project.clientName || copy.common.noClient}</span><span>{project.dueDate ? copy.projects.detail.deadline(formatShortDate(project.dueDate, locale)) : copy.projects.detail.undefinedDeadline}</span></div>{hasPermission(workspace.role, "projects.write") && <ProjectLifecycleActions id={project.id} name={project.name} status={project.status} canDelete={["owner", "admin"].includes(workspace.role)} locale={locale} redirectAfterDelete />}</div>
      <div className="detail-progress"><strong>{project.progress}%</strong><span>{copy.projects.detail.overallProgress}</span>{!archived && <ProjectProgress id={project.id} progress={project.progress} locale={locale} />}</div>
    </section>
    {archived && <div className="project-archived-notice" role="status">{copy.projects.lifecycle.archivedNotice}</div>}
    <section className="app-summary-strip" aria-label={copy.projects.detail.summaryAria}>
      <article><ListChecks aria-hidden="true" /><span><strong>{tasks.length}</strong><small>{copy.projects.detail.tasks}</small></span></article>
      <article><CheckCircle2 aria-hidden="true" /><span><strong>{completedTasks}</strong><small>{copy.projects.detail.completedTasks}</small></span></article>
      <article><Clock3 aria-hidden="true" /><span><strong>{pendingApprovals}</strong><small>{copy.projects.detail.pendingApprovals}</small></span></article>
    </section>
    <section className="detail-two-column">
      <article className="dashboard-panel detail-section">
        <div className="detail-section-heading"><div><span className="panel-kicker">{copy.projects.detail.execution}</span><h2>{copy.projects.detail.tasks}</h2></div>{!archived && <TaskForm projects={[{ id: project.id, name: project.name }]} fixedProjectId={project.id} locale={locale} />}</div>
        {tasks.length === 0 ? <div className="empty-state compact"><ListChecks aria-hidden="true" /><h3>{copy.projects.detail.noTasks}</h3><p>{copy.projects.detail.noTasksDetail}</p></div> : <div className="task-list compact-list">{tasks.map((task) => <article className={`task-card ${task.status}`} key={task.id}><div><span className={`priority-badge ${task.priority}`}>{priorityLabel(task.priority, locale)}</span><h3>{task.title}</h3><p>{task.description || copy.common.noDescription}</p><small>{task.dueDate ? copy.projects.detail.deadline(formatShortDate(task.dueDate, locale)) : copy.projects.detail.noDeadline}</small></div>{!archived && <TaskStatusActions key={task.status} id={task.id} status={task.status} locale={locale} />}</article>)}</div>}
      </article>
      <article className="dashboard-panel detail-section">
        <div className="detail-section-heading"><div><span className="panel-kicker">{copy.projects.detail.decisions}</span><h2>{copy.projects.detail.approvals}</h2></div><Link className="text-link" href="/app/aprovacoes">{copy.projects.detail.manage}</Link></div>
        {approvals.length === 0 ? <div className="empty-state compact"><FileCheck2 aria-hidden="true" /><h3>{copy.projects.detail.noApprovals}</h3><p>{copy.projects.detail.noApprovalsDetail}</p></div> : <div className="mini-record-list">{approvals.map((approval) => <article key={approval.id}><span className={`approval-status ${approval.status}`}>{approvalStatus(approval.status, locale)}</span><h3>{approval.title}</h3><p>{approval.description || copy.projects.detail.noNotes}</p></article>)}</div>}
      </article>
    </section>
    <ProjectDeliverables projectId={project.id} items={deliverables} canWrite={!archived && hasPermission(workspace.role, "deliverables.write")} canComment={!archived && hasPermission(workspace.role, "comments.write")} locale={locale} />
    <section className="dashboard-panel detail-section">
      <div className="detail-section-heading"><div><span className="panel-kicker">{copy.projects.detail.privateFiles}</span><h2>{copy.projects.detail.documents}</h2></div>{!archived && <FileUpload projects={[{ id: project.id, name: project.name }]} fixedProjectId={project.id} locale={locale} />}</div>
      {files.length === 0 ? <div className="empty-state compact"><Files aria-hidden="true" /><h3>{copy.projects.detail.noFiles}</h3><p>{copy.projects.detail.noFilesDetail}</p></div> : <div className="file-list">{files.map((file) => <article key={file.id}><span className="file-icon"><Files aria-hidden="true" /></span><div><strong>{file.originalName}</strong><small>{formatBytes(file.sizeBytes, locale)} · {file.uploaderName}</small></div><a href={`/api/files/${file.id}/download`}><Download aria-hidden="true" />{copy.projects.detail.download}</a><FileDelete id={file.id} name={file.originalName} locale={locale} /></article>)}</div>}
    </section>
  </AppShell>;
}

function formatShortDate(value: string, locale: SiteLocale) { return new Intl.DateTimeFormat(toIntlLocale(locale), { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }
function formatBytes(value: number, locale: SiteLocale) { return value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${new Intl.NumberFormat(toIntlLocale(locale), { maximumFractionDigits: 1 }).format(value / 1024 / 1024)} MB`; }
function priorityLabel(value: string, locale: SiteLocale) { const labels = getOperationalCopy(locale).tasks.priorities; return value === "high" ? labels.high : value === "low" ? labels.low : labels.medium; }
function approvalStatus(value: string, locale: SiteLocale) { const labels = getOperationalCopy(locale).projects.detail; return value === "approved" ? labels.approvalApproved : value === "changes_requested" ? labels.approvalChanges : labels.approvalPending; }

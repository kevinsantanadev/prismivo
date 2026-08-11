import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, CircleDashed, ListChecks, TimerReset } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";
import { getRequestLocale } from "@/lib/site-locale-server";
import { findWorkspaceByEmail, getProjectsData, getTasksData, getUnreadNotificationCount } from "@/lib/workspace";
import { AppShell } from "../components/app-shell";
import { TaskForm } from "../components/task-form";
import { TaskStatusActions } from "../components/task-status-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tarefas", description: "Fluxo de execução protegido do Prismivo.", robots: { index: false, follow: false } };

export default async function TasksPage() {
  const identity = await requireSessionUser("/app/tarefas");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");

  const [tasks, projects, unreadCount, locale] = await Promise.all([
    getTasksData(workspace.organizationId),
    getProjectsData(workspace.organizationId),
    getUnreadNotificationCount(workspace.userId),
    getRequestLocale(),
  ]);
  const copy = getOperationalCopy(locale);
  const todo = tasks.filter((task) => task.status === "todo");
  const progress = tasks.filter((task) => task.status === "in_progress");
  const done = tasks.filter((task) => task.status === "done");

  return (
    <AppShell active="tasks" title="Tarefas" description="Prioridades e andamento da operação" workspace={workspace} unreadCount={unreadCount}>
      <section className="app-page-intro">
        <div><span className="eyebrow">{copy.tasks.eyebrow}</span><h1>{copy.tasks.title}</h1><p>{copy.tasks.intro}</p></div>
        <TaskForm locale={locale} projects={projects.map(({ id, name, clientName }) => ({ id, name, clientName }))} />
      </section>
      <section className="app-summary-strip" aria-label={copy.tasks.summaryAria}>
        <article><CircleDashed aria-hidden="true" /><span><strong>{todo.length}</strong><small>{copy.tasks.todoCount}</small></span></article>
        <article><TimerReset aria-hidden="true" /><span><strong>{progress.length}</strong><small>{copy.tasks.progressCount}</small></span></article>
        <article><CheckCircle2 aria-hidden="true" /><span><strong>{done.length}</strong><small>{copy.tasks.doneCount}</small></span></article>
      </section>
      {tasks.length === 0 ? (
        <section className="dashboard-panel empty-state"><ListChecks aria-hidden="true" /><h2>{copy.tasks.noTasks}</h2><p>{copy.tasks.noTasksDetail}</p></section>
      ) : (
        <section className="task-board" aria-label={copy.tasks.boardAria}>
          <TaskColumn title={copy.tasks.columns.todo} items={todo} tone="todo" locale={locale} />
          <TaskColumn title={copy.tasks.columns.inProgress} items={progress} tone="in_progress" locale={locale} />
          <TaskColumn title={copy.tasks.columns.done} items={done} tone="done" locale={locale} />
        </section>
      )}
    </AppShell>
  );
}

type TaskItem = Awaited<ReturnType<typeof getTasksData>>[number];

function TaskColumn({ title, items, tone, locale }: { title: string; items: TaskItem[]; tone: string; locale: SiteLocale }) {
  const copy = getOperationalCopy(locale);
  return (
    <section className="task-column">
      <header><span className={`task-column-dot ${tone}`} /><h2>{title}</h2><small>{items.length}</small></header>
      <div>{items.length === 0 ? <p className="column-empty">{copy.tasks.emptyColumn}</p> : items.map((task) => (
        <article className={`task-card ${task.status}`} key={task.id}>
          <span className={`priority-badge ${task.priority}`}>{priorityLabel(task.priority, locale)}</span>
          <h3>{task.title}</h3>
          <p>{task.description || copy.common.noDescription}</p>
          <div className="task-context"><span>{task.projectName}</span><small>{task.clientName || copy.common.noClient}{task.dueDate ? ` · ${formatShortDate(task.dueDate, locale)}` : ""}</small></div>
          <TaskStatusActions id={task.id} status={task.status} locale={locale} />
        </article>
      ))}</div>
    </section>
  );
}

function priorityLabel(value: string, locale: SiteLocale) {
  const labels = getOperationalCopy(locale).tasks.priorities;
  return value === "high" ? labels.high : value === "low" ? labels.low : labels.medium;
}

function formatShortDate(value: string, locale: SiteLocale) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), { day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`));
}

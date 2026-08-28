import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ListChecks } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import { getRequestLocale } from "@/lib/site-locale-server";
import { findWorkspaceByEmail, getProjectsData, getTasksData, getUnreadNotificationCount } from "@/lib/workspace";
import { AppShell } from "../components/app-shell";
import { TaskBoard } from "../components/task-board";
import { TaskForm } from "../components/task-form";

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
  const activeProjects = projects.filter((project) => project.status === "active");

  return (
    <AppShell active="tasks" title="Tarefas" description="Prioridades e andamento da operação" workspace={workspace} unreadCount={unreadCount}>
      <section className="app-page-intro">
        <div><span className="eyebrow">{copy.tasks.eyebrow}</span><h1>{copy.tasks.title}</h1><p>{copy.tasks.intro}</p></div>
        <TaskForm locale={locale} projects={activeProjects.map(({ id, name, clientName }) => ({ id, name, clientName }))} />
      </section>
      {tasks.length === 0 ? (
        <section className="dashboard-panel empty-state"><ListChecks aria-hidden="true" /><h2>{copy.tasks.noTasks}</h2><p>{copy.tasks.noTasksDetail}</p></section>
      ) : (
        <TaskBoard key={tasks.map((task) => `${task.id}:${task.status}`).join("|")} initialTasks={tasks} locale={locale} />
      )}
    </AppShell>
  );
}

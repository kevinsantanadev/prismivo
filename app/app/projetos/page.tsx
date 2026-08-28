import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, FolderKanban, Gauge } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import { hasPermission } from "@/lib/permissions";
import { activeProjectLimitForPlan } from "@/lib/project-limits";
import { getRequestLocale } from "@/lib/site-locale-server";
import { AppShell } from "../components/app-shell";
import { ProjectDirectory } from "../components/project-directory";
import { ProjectForm } from "../project-form";
import { findWorkspaceByEmail, getProjectsData, getUnreadNotificationCount } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Projetos", description: "Projetos protegidos do espaço Prismivo.", robots: { index: false, follow: false } };

export default async function ProjectsPage() {
  const identity = await requireSessionUser("/app/projetos");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  const [projects, unreadCount, locale] = await Promise.all([
    getProjectsData(workspace.organizationId),
    getUnreadNotificationCount(workspace.userId),
    getRequestLocale(),
  ]);
  const copy = getOperationalCopy(locale).projects;
  const activeProjects = projects.filter((project) => project.status === "active");
  const visibleProjects = projects.filter((project) => project.status !== "archived");
  const completed = projects.filter((project) => project.status === "completed").length;
  const averageProgress = visibleProjects.length ? Math.round(visibleProjects.reduce((total, project) => total + project.progress, 0) / visibleProjects.length) : 0;
  const projectLimit = activeProjectLimitForPlan(workspace.plan);

  return (
    <AppShell active="projects" title="Projetos" description="Execução e prazos em um só lugar" workspace={workspace} unreadCount={unreadCount}>
      <section className="app-page-intro"><div><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p></div><ProjectForm locale={locale} activeProjects={activeProjects.length} projectLimit={projectLimit} /></section>
      <section className="app-summary-strip" aria-label={copy.summaryAria}><article><FolderKanban aria-hidden="true" /><span><strong>{projects.length}</strong><small>{copy.registered}</small></span></article><article><CheckCircle2 aria-hidden="true" /><span><strong>{completed}</strong><small>{copy.completedCount}</small></span></article><article><Gauge aria-hidden="true" /><span><strong>{averageProgress}%</strong><small>{copy.averageProgress}</small></span></article></section>
      <ProjectDirectory projects={projects} locale={locale} canManage={hasPermission(workspace.role, "projects.write")} canDelete={["owner", "admin"].includes(workspace.role)} />
    </AppShell>
  );
}

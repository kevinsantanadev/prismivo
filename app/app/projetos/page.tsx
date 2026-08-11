import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, FolderKanban, Gauge } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
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
  const [projects, unreadCount] = await Promise.all([
    getProjectsData(workspace.organizationId),
    getUnreadNotificationCount(workspace.userId),
  ]);
  const completed = projects.filter((project) => project.status === "completed").length;
  const averageProgress = projects.length ? Math.round(projects.reduce((total, project) => total + project.progress, 0) / projects.length) : 0;

  return (
    <AppShell active="projects" title="Projetos" description="Execução e prazos em um só lugar" workspace={workspace} unreadCount={unreadCount}>
      <section className="app-page-intro"><div><span className="eyebrow">EXECUÇÃO VISÍVEL</span><h1>Transforme o trabalho em progresso que todos entendem.</h1><p>Atualize o andamento, acompanhe prazos e mantenha cada projeto ligado ao cliente correto.</p></div><ProjectForm /></section>
      <section className="app-summary-strip" aria-label="Resumo dos projetos"><article><FolderKanban aria-hidden="true" /><span><strong>{projects.length}</strong><small>projetos cadastrados</small></span></article><article><CheckCircle2 aria-hidden="true" /><span><strong>{completed}</strong><small>concluídos</small></span></article><article><Gauge aria-hidden="true" /><span><strong>{averageProgress}%</strong><small>progresso médio</small></span></article></section>
      <ProjectDirectory projects={projects} />
    </AppShell>
  );
}

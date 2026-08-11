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

  const data = await getDashboardData(workspace.organizationId, workspace.userId);
  const firstName = workspace.userName.split(" ")[0] || "usuário";

  return (
    <AppShell active="dashboard" title="Visão geral" description="Dados protegidos da sua empresa" workspace={workspace} unreadCount={data.metrics.unread}>
          <section className="app-welcome"><div><span className="eyebrow">OPERAÇÃO EM MOVIMENTO</span><h1>Bom trabalho, {firstName}.</h1><p>Acompanhe o que pede atenção e conduza o próximo passo com contexto.</p></div><ProjectForm /></section>

          <section className="app-metrics" id="metricas" aria-label="Resumo operacional">
            <MetricCard label="Clientes ativos" value={data.metrics.clients} detail="Limite do plano: 3" icon={<Users />} />
            <MetricCard label="Projetos ativos" value={data.metrics.projects} detail="Inclui cenários demonstrativos" icon={<FolderKanban />} />
            <MetricCard label="Aprovações no prazo" value={`${data.metrics.approvalRate}%`} detail="Métrica demonstrativa" icon={<FileCheck2 />} />
            <MetricCard label="Notificações" value={data.metrics.unread} detail="Itens ainda não lidos" icon={<Bell />} />
          </section>

          <section className="dashboard-grid">
            <article className="dashboard-panel onboarding-progress">
              <div className="panel-heading"><div><span className="panel-kicker">PRIMEIROS PASSOS</span><h2>Prepare seu espaço</h2></div><strong>2 de 3</strong></div>
              <div className="onboarding-bar"><span /></div>
              <ul><li className="done"><CheckCircle2 aria-hidden="true" /><span><strong>Empresa criada</strong><small>Identidade e espaço configurados</small></span></li><li className="done"><CheckCircle2 aria-hidden="true" /><span><strong>Conheça o Projeto Aurora</strong><small>Um exemplo seguro para explorar</small></span></li><li><span className="step-dot">3</span><span><strong>Crie um projeto real</strong><small>Use o botão “Novo projeto”</small></span></li></ul>
            </article>

            <article className="dashboard-panel prismivo-pulse">
              <div className="panel-heading"><div><span className="panel-kicker">PRISMIVO PULSE</span><h2>Saúde da operação</h2></div><Sparkles aria-hidden="true" /></div>
              <div className="pulse-score"><span><strong>84</strong><small>/100</small></span></div>
              <p>Seu espaço começou organizado. Crie um projeto real para ativar recomendações baseadas na operação.</p>
              <div className="pulse-tags"><span>Clareza alta</span><span>1 ação sugerida</span></div>
            </article>
          </section>

          <section className="dashboard-panel projects-panel">
            <div className="panel-heading"><div><span className="panel-kicker">PORTFÓLIO ATIVO</span><h2>Projetos recentes</h2></div><Link href="/app/projetos">Ver todos</Link></div>
            {data.projects.length === 0 ? <div className="empty-state"><FolderKanban aria-hidden="true" /><h3>Nenhum projeto ainda</h3><p>Crie o primeiro projeto para acompanhar atividades e clientes.</p></div> : <div className="responsive-table"><table><caption className="sr-only">Projetos recentes da empresa</caption><thead><tr><th scope="col">Projeto</th><th scope="col">Cliente</th><th scope="col">Progresso</th><th scope="col">Prazo</th><th scope="col">Status</th></tr></thead><tbody>{data.projects.map((project) => <tr key={project.id}><td><strong>{project.name}</strong>{project.isDemo && <small className="demo-badge">Demonstração</small>}<span>{project.description || "Sem descrição"}</span></td><td>{project.clientName ?? "Sem cliente"}</td><td><div className="table-progress" aria-label={`${project.progress}% concluído`}><span style={{ width: `${project.progress}%` }} /></div><small>{project.progress}%</small></td><td>{formatDate(project.dueDate)}</td><td><span className="status-badge">{project.status === "active" ? "Ativo" : project.status}</span></td></tr>)}</tbody></table></div>}
          </section>

          <section className="dashboard-grid lower-grid">
            <article className="dashboard-panel"><div className="panel-heading"><div><span className="panel-kicker">HISTÓRICO</span><h2>Atividade recente</h2></div><Activity aria-hidden="true" /></div><ul className="activity-list">{data.activities.map((activity) => <li key={activity.id}><span className="activity-dot" /><div><strong>{activity.title}</strong><p>{activity.detail}</p><small>{formatTimestamp(activity.createdAt)}</small></div></li>)}</ul></article>
            <article className="dashboard-panel"><div className="panel-heading"><div><span className="panel-kicker">CENTRAL</span><h2>Notificações</h2></div><Bell aria-hidden="true" /></div><ul className="notification-list">{data.notifications.map((notification) => <li key={notification.id} className={!notification.readAt ? "unread" : ""}><span><CircleDollarSign aria-hidden="true" /></span><div><strong>{notification.title}</strong><p>{notification.body}</p></div></li>)}</ul><Link className="panel-text-link" href="/app/notificacoes">Abrir central de notificações</Link></article>
          </section>
    </AppShell>
  );
}

function MetricCard({ label, value, detail, icon }: { label: string; value: string | number; detail: string; icon: React.ReactNode }) {
  return <article><span className="metric-card-icon" aria-hidden="true">{icon}</span><div><small>{label}</small><strong>{value}</strong><span>{detail}</span></div></article>;
}

function formatDate(value: string | null) {
  if (!value) return "Sem prazo";
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

function formatTimestamp(value: string) {
  const date = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return "Agora";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(date);
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, FileCheck2, RotateCcw } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
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
  const [items, projects, unreadCount] = await Promise.all([
    getApprovalsData(workspace.organizationId),
    getProjectsData(workspace.organizationId),
    getUnreadNotificationCount(workspace.userId),
  ]);
  const pending = items.filter((item) => item.status === "pending").length;
  const approved = items.filter((item) => item.status === "approved").length;
  const changes = items.filter((item) => item.status === "changes_requested").length;

  return (
    <AppShell active="approvals" title="Aprovações" description="Decisões registradas e vinculadas ao projeto" workspace={workspace} unreadCount={unreadCount}>
      <section className="app-page-intro"><div><span className="eyebrow">MENOS RETRABALHO</span><h1>Cada decisão com contexto, responsável e histórico.</h1><p>Registre aprovações e solicitações de ajustes sem depender de conversas dispersas.</p></div><ApprovalForm projects={projects.map(({ id, name, clientName }) => ({ id, name, clientName }))} /></section>
      <section className="app-summary-strip" aria-label="Resumo das aprovações"><article><Clock3 aria-hidden="true" /><span><strong>{pending}</strong><small>pendentes</small></span></article><article><CheckCircle2 aria-hidden="true" /><span><strong>{approved}</strong><small>aprovadas</small></span></article><article><RotateCcw aria-hidden="true" /><span><strong>{changes}</strong><small>com ajustes</small></span></article></section>
      <section className="approval-list" aria-labelledby="approval-list-title">
        <div className="section-mini-heading"><span className="panel-kicker">HISTÓRICO DE DECISÕES</span><h2 id="approval-list-title">Solicitações</h2></div>
        {items.length === 0 ? <div className="dashboard-panel empty-state"><FileCheck2 aria-hidden="true" /><h3>Nenhuma aprovação ainda</h3><p>Crie uma solicitação ligada a um projeto ativo.</p></div> : items.map((item) => (
          <article className="dashboard-panel approval-card" key={item.id}>
            <div className="approval-card-icon"><FileCheck2 aria-hidden="true" /></div>
            <div className="approval-card-body"><div className="approval-card-meta"><span>{item.projectName}</span><small>{item.clientName || "Sem cliente"}</small></div><h3>{item.title}</h3><p>{item.description || "Sem observações adicionais."}</p><small>Criada em {formatDate(item.createdAt)}{item.dueDate ? ` · prazo ${formatShortDate(item.dueDate)}` : ""}</small></div>
            <div className="approval-card-status"><span className={`approval-status ${item.status}`}>{statusLabel(item.status)}</span>{item.status === "pending" ? <ApprovalActions id={item.id} /> : <small>Decisão registrada {item.decidedAt ? `em ${formatDate(item.decidedAt)}` : ""}</small>}</div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}

function statusLabel(status: string) { return status === "approved" ? "Aprovada" : status === "changes_requested" ? "Ajustes solicitados" : "Pendente"; }
function formatDate(value: string) { const date = new Date(value.replace(" ", "T") + "Z"); return Number.isNaN(date.getTime()) ? "agora" : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(date); }
function formatShortDate(value: string) { return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`)); }

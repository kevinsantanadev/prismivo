import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, Download, Headphones, Paperclip, UserRound } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { findWorkspaceByEmail, getTicketDetail, getUnreadNotificationCount } from "@/lib/workspace";
import { AppShell } from "../../components/app-shell";
import { TicketAttachmentForm } from "../../components/ticket-attachment-form";
import { TicketMessageForm } from "../../components/ticket-message-form";
import { TicketStatusActions } from "../../components/ticket-status-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Detalhes do atendimento", description: "Histórico protegido de atendimento no Prismivo.", robots: { index: false, follow: false } };

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const identity = await requireSessionUser(`/app/atendimento/${id}`);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  const [detail, unreadCount] = await Promise.all([getTicketDetail(workspace.organizationId, id), getUnreadNotificationCount(workspace.userId)]);
  if (!detail) notFound();
  const closed = detail.ticket.status === "closed";

  return <AppShell active="support" title={detail.ticket.protocol} description="Histórico do atendimento" workspace={workspace} unreadCount={unreadCount}>
    <Link className="detail-back" href="/app/atendimento"><ArrowLeft aria-hidden="true" />Voltar para atendimentos</Link>
    <section className="detail-hero ticket-detail-hero">
      <div><span className="eyebrow">{detail.ticket.protocol}</span><h1>{detail.ticket.subject}</h1><p>{categoryLabel(detail.ticket.category)} · prioridade {priorityLabel(detail.ticket.priority).toLocaleLowerCase("pt-BR")}</p></div>
      <div className="ticket-detail-actions"><span className={`ticket-status ${detail.ticket.status}`}>{closed ? "Encerrado" : "Aberto"}</span><TicketStatusActions id={detail.ticket.id} status={detail.ticket.status} /></div>
    </section>
    <section className="detail-info-grid" aria-label="Informações do atendimento">
      <article><UserRound aria-hidden="true" /><span><small>Solicitante</small><strong>{detail.ticket.requesterName}</strong></span></article>
      <article><Building2 aria-hidden="true" /><span><small>Cliente</small><strong>{detail.ticket.clientName || "Solicitação interna"}</strong></span></article>
      <article><CalendarDays aria-hidden="true" /><span><small>Aberto em</small><strong>{formatDate(detail.ticket.createdAt)}</strong></span></article>
      <article><Headphones aria-hidden="true" /><span><small>Mensagens</small><strong>{detail.messages.length}</strong></span></article>
    </section>
    <section className="dashboard-panel ticket-attachments" aria-labelledby="ticket-attachments-title">
      <div className="detail-section-heading"><div><span className="panel-kicker">ARQUIVOS PRIVADOS</span><h2 id="ticket-attachments-title">Anexos do atendimento</h2></div><Paperclip aria-hidden="true" /></div>
      {detail.attachments.length === 0 ? <p className="empty-copy">Nenhum anexo foi adicionado a esta conversa.</p> : <div className="ticket-attachment-list">{detail.attachments.map((attachment) => <article key={attachment.id}><Paperclip aria-hidden="true" /><div><strong>{attachment.originalName}</strong><small>{formatBytes(attachment.sizeBytes)} · {formatDate(attachment.createdAt)}</small></div><a href={`/api/files/${encodeURIComponent(attachment.fileId)}/download`}><Download aria-hidden="true" />Baixar</a></article>)}</div>}
      <TicketAttachmentForm ticketId={detail.ticket.id} disabled={closed} />
    </section>
    <section className="ticket-conversation">
      <div className="section-mini-heading"><span className="panel-kicker">HISTÓRICO COMPLETO</span><h2>Conversa</h2></div>
      <div className="message-timeline">{detail.messages.map((message) => <article key={message.id}><div className="message-avatar" aria-hidden="true">{initials(message.authorName)}</div><div><header><strong>{message.authorName}</strong><time dateTime={message.createdAt}>{formatDate(message.createdAt)}</time></header><p>{message.body}</p></div></article>)}</div>
      <TicketMessageForm ticketId={detail.ticket.id} disabled={closed} />
    </section>
  </AppShell>;
}

function initials(value: string) { return value.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function categoryLabel(value: string) { return ({ technical: "Técnico", billing: "Cobrança", access: "Acesso", question: "Dúvida", other: "Outro" } as Record<string, string>)[value] ?? value; }
function priorityLabel(value: string) { return value === "high" ? "Alta" : value === "low" ? "Baixa" : "Normal"; }
function formatDate(value: string) { const date = new Date(value.replace(" ", "T") + (value.includes("Z") || value.includes("+") ? "" : "Z")); return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(date); }
function formatBytes(value: number) { return value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`; }

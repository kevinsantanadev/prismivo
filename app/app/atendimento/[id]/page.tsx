import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, Download, Headphones, Paperclip, UserRound } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";
import { getRequestLocale } from "@/lib/site-locale-server";
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
  const [detail, unreadCount, locale] = await Promise.all([getTicketDetail(workspace.organizationId, id), getUnreadNotificationCount(workspace.userId), getRequestLocale()]);
  if (!detail) notFound();
  const copy = getOperationalCopy(locale).support;
  const closed = detail.ticket.status === "closed";
  const priority = label(copy.priorities, detail.ticket.priority).toLocaleLowerCase(toIntlLocale(locale));

  return <AppShell active="support" title={detail.ticket.protocol} description={copy.detail.history} workspace={workspace} unreadCount={unreadCount}>
    <Link className="detail-back" href="/app/atendimento"><ArrowLeft aria-hidden="true" />{copy.detail.back}</Link>
    <section className="detail-hero ticket-detail-hero"><div><span className="eyebrow">{detail.ticket.protocol}</span><h1>{detail.ticket.subject}</h1><p>{label(copy.categories, detail.ticket.category)} · {copy.detail.priority(priority)}</p></div><div className="ticket-detail-actions"><span className={`ticket-status ${detail.ticket.status}`}>{closed ? copy.statuses.closed : copy.statuses.open}</span><TicketStatusActions id={detail.ticket.id} status={detail.ticket.status} locale={locale} /></div></section>
    <section className="detail-info-grid" aria-label={copy.detail.infoAria}><article><UserRound aria-hidden="true" /><span><small>{copy.detail.requester}</small><strong>{detail.ticket.requesterName}</strong></span></article><article><Building2 aria-hidden="true" /><span><small>{copy.detail.client}</small><strong>{detail.ticket.clientName || copy.detail.internal}</strong></span></article><article><CalendarDays aria-hidden="true" /><span><small>{copy.detail.openedAt}</small><strong>{formatDate(detail.ticket.createdAt, locale)}</strong></span></article><article><Headphones aria-hidden="true" /><span><small>{copy.detail.messages}</small><strong>{detail.messages.length}</strong></span></article></section>
    <section className="dashboard-panel ticket-attachments" aria-labelledby="ticket-attachments-title"><div className="detail-section-heading"><div><span className="panel-kicker">{copy.detail.privateFiles}</span><h2 id="ticket-attachments-title">{copy.detail.attachments}</h2></div><Paperclip aria-hidden="true" /></div>{detail.attachments.length === 0 ? <p className="empty-copy">{copy.detail.noAttachments}</p> : <div className="ticket-attachment-list">{detail.attachments.map((attachment) => <article key={attachment.id}><Paperclip aria-hidden="true" /><div><strong>{attachment.originalName}</strong><small>{formatBytes(attachment.sizeBytes, locale)} · {formatDate(attachment.createdAt, locale)}</small></div><a href={`/api/files/${encodeURIComponent(attachment.fileId)}/download`}><Download aria-hidden="true" />{copy.detail.download}</a></article>)}</div>}<TicketAttachmentForm ticketId={detail.ticket.id} disabled={closed} locale={locale} /></section>
    <section className="ticket-conversation"><div className="section-mini-heading"><span className="panel-kicker">{copy.detail.completeHistory}</span><h2>{copy.detail.conversation}</h2></div><div className="message-timeline">{detail.messages.map((message) => <article key={message.id}><div className="message-avatar" aria-hidden="true">{initials(message.authorName, locale)}</div><div><header><strong>{message.authorName}</strong><time dateTime={message.createdAt}>{formatDate(message.createdAt, locale)}</time></header><p>{message.body}</p></div></article>)}</div><TicketMessageForm ticketId={detail.ticket.id} disabled={closed} locale={locale} /></section>
  </AppShell>;
}

function label(values: Record<string, string>, value: string) { return values[value] ?? value; }
function initials(value: string, locale: SiteLocale) { return value.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase(toIntlLocale(locale)); }
function formatDate(value: string, locale: SiteLocale) { const date = new Date(value.replace(" ", "T") + (value.includes("Z") || value.includes("+") ? "" : "Z")); return new Intl.DateTimeFormat(toIntlLocale(locale), { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(date); }
function formatBytes(value: number, locale: SiteLocale) { return value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${new Intl.NumberFormat(toIntlLocale(locale), { maximumFractionDigits: 1 }).format(value / 1024 / 1024)} MB`; }

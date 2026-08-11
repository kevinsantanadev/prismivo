import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, Headphones, Siren } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";
import { getRequestLocale } from "@/lib/site-locale-server";
import { findWorkspaceByEmail, getClientsData, getTicketsData, getUnreadNotificationCount } from "@/lib/workspace";
import { AppShell } from "../components/app-shell";
import { TicketForm } from "../components/ticket-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Atendimento", description: "Solicitações rastreáveis da empresa no Prismivo.", robots: { index: false, follow: false } };

export default async function SupportPage() {
  const identity = await requireSessionUser("/app/atendimento");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  const [tickets, clients, unreadCount, locale] = await Promise.all([
    getTicketsData(workspace.organizationId),
    getClientsData(workspace.organizationId),
    getUnreadNotificationCount(workspace.userId),
    getRequestLocale(),
  ]);
  const copy = getOperationalCopy(locale).support;
  const open = tickets.filter((ticket) => ticket.status === "open").length;
  const high = tickets.filter((ticket) => ticket.priority === "high" && ticket.status === "open").length;
  const closed = tickets.filter((ticket) => ticket.status === "closed").length;

  return <AppShell active="support" title={copy.requests} description={copy.queue} workspace={workspace} unreadCount={unreadCount}>
    <section className="app-page-intro"><div><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p></div><TicketForm clients={clients.map(({ id, name, company }) => ({ id, name, company }))} locale={locale} /></section>
    <section className="app-summary-strip" aria-label={copy.summaryAria}><article><Clock3 aria-hidden="true" /><span><strong>{open}</strong><small>{copy.openCount}</small></span></article><article><Siren aria-hidden="true" /><span><strong>{high}</strong><small>{copy.highCount}</small></span></article><article><CheckCircle2 aria-hidden="true" /><span><strong>{closed}</strong><small>{copy.closedCount}</small></span></article></section>
    <section className="ticket-list" aria-labelledby="ticket-list-title"><div className="section-mini-heading"><span className="panel-kicker">{copy.queue}</span><h2 id="ticket-list-title">{copy.requests}</h2></div>
      {tickets.length === 0 ? <div className="dashboard-panel empty-state"><Headphones aria-hidden="true" /><h3>{copy.empty}</h3><p>{copy.emptyDetail}</p></div> : tickets.map((ticket) => <Link className="dashboard-panel ticket-card" href={`/app/atendimento/${ticket.id}`} key={ticket.id}><span className="ticket-icon"><Headphones aria-hidden="true" /></span><div><div className="ticket-meta"><span>{ticket.protocol}</span><small>{label(copy.categories, ticket.category)} · {ticket.clientName || copy.internal}</small></div><h3>{ticket.subject}</h3><p>{copy.requestedBy(ticket.requesterName, formatDate(ticket.updatedAt, locale))}</p></div><div className="ticket-state"><span className={`priority-badge ${ticket.priority}`}>{label(copy.priorities, ticket.priority)}</span><span className={`ticket-status ${ticket.status}`}>{ticket.status === "closed" ? copy.statuses.closed : copy.statuses.open}</span></div></Link>)}
    </section>
  </AppShell>;
}

function label(values: Record<string, string>, value: string) { return values[value] ?? value; }
function formatDate(value: string, locale: SiteLocale) { const date = new Date(value.replace(" ", "T") + "Z"); return new Intl.DateTimeFormat(toIntlLocale(locale), { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(date); }

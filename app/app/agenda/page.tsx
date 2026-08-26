import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarCheck2, CalendarClock, CircleAlert } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { dateKeyInSaoPaulo, summarizeAgenda } from "@/lib/marco23";
import { getMarco23Copy } from "@/lib/marco23-i18n";
import { getRequestLocale } from "@/lib/site-locale-server";
import { findWorkspaceByEmail, getAgendaData, getUnreadNotificationCount } from "@/lib/workspace";
import { AgendaBoard } from "../components/agenda-board";
import { AppShell } from "../components/app-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Agenda", description: "Agenda operacional unificada do Prismivo.", robots: { index: false, follow: false } };

export default async function AgendaPage() {
  const identity = await requireSessionUser("/app/agenda");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  const [events, unreadCount, locale] = await Promise.all([
    getAgendaData(workspace.organizationId),
    getUnreadNotificationCount(workspace.userId),
    getRequestLocale(),
  ]);
  const copy = getMarco23Copy(locale).agenda;
  const today = dateKeyInSaoPaulo();
  const summary = summarizeAgenda(events, today);

  return (
    <AppShell active="agenda" title={copy.navTitle} description={copy.navDescription} workspace={workspace} unreadCount={unreadCount}>
      <section className="app-page-intro agenda-intro"><div><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p></div><span className="marco-badge">MARCO 23</span></section>
      <section className="app-summary-strip agenda-summary" aria-label={copy.navDescription}>
        <article><CircleAlert aria-hidden="true" /><span><strong>{summary.overdue}</strong><small>{copy.summary.overdue}</small></span></article>
        <article><CalendarClock aria-hidden="true" /><span><strong>{summary.today}</strong><small>{copy.summary.today}</small></span></article>
        <article><CalendarCheck2 aria-hidden="true" /><span><strong>{summary.next}</strong><small>{copy.summary.next}</small></span></article>
      </section>
      <AgendaBoard events={events} locale={locale} today={today} />
    </AppShell>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BellRing, CalendarClock, Workflow } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { dateKeyInSaoPaulo } from "@/lib/marco23";
import { getMarco23Copy } from "@/lib/marco23-i18n";
import { getRequestLocale } from "@/lib/site-locale-server";
import { findWorkspaceByEmail, getAgendaData, getUnreadNotificationCount } from "@/lib/workspace";
import { AppShell } from "../components/app-shell";
import { SmartRoutines } from "../components/smart-routines";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Automações", description: "Rotinas inteligentes do Prismivo.", robots: { index: false, follow: false } };

export default async function AutomationsPage() {
  const identity = await requireSessionUser("/app/automacoes");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  const [events, unreadCount, locale] = await Promise.all([
    getAgendaData(workspace.organizationId),
    getUnreadNotificationCount(workspace.userId),
    getRequestLocale(),
  ]);
  const copy = getMarco23Copy(locale).routines;
  const counts = {
    task: events.filter((event) => event.kind === "task").length,
    approval: events.filter((event) => event.kind === "approval").length,
    project: events.filter((event) => event.kind === "project").length,
  };

  return <AppShell active="automations" title={copy.navTitle} description={copy.navDescription} workspace={workspace} unreadCount={unreadCount}>
    <section className="app-page-intro routines-intro"><div><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p></div><span className="marco-badge">MARCO 23 · BETA</span></section>
    <section className="app-summary-strip" aria-label={copy.navDescription}>
      <article><CalendarClock aria-hidden="true" /><span><strong>{counts.task}</strong><small>{copy.rules.task[0]}</small></span></article>
      <article><BellRing aria-hidden="true" /><span><strong>{counts.approval}</strong><small>{copy.rules.approval[0]}</small></span></article>
      <article><Workflow aria-hidden="true" /><span><strong>{counts.project}</strong><small>{copy.rules.project[0]}</small></span></article>
    </section>
    <SmartRoutines events={events} locale={locale} today={dateKeyInSaoPaulo()} />
  </AppShell>;
}

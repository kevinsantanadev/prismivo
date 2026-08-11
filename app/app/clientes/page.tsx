import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BriefcaseBusiness, UserCheck, Users } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import { getRequestLocale } from "@/lib/site-locale-server";
import { AppShell } from "../components/app-shell";
import { ClientDirectory } from "../components/client-directory";
import { ClientForm } from "../components/client-form";
import { findWorkspaceByEmail, getClientsData, getUnreadNotificationCount } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Clientes", description: "Carteira protegida de clientes do Prismivo.", robots: { index: false, follow: false } };

export default async function ClientsPage() {
  const identity = await requireSessionUser("/app/clientes");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  const [clients, unreadCount, locale] = await Promise.all([
    getClientsData(workspace.organizationId),
    getUnreadNotificationCount(workspace.userId),
    getRequestLocale(),
  ]);
  const copy = getOperationalCopy(locale).clients;
  const realClients = clients.filter((client) => !client.isDemo).length;
  const projects = clients.reduce((total, client) => total + Number(client.projectCount), 0);

  return (
    <AppShell active="clients" title="Clientes" description="Carteira protegida por empresa" workspace={workspace} unreadCount={unreadCount}>
      <section className="app-page-intro"><div><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p></div><ClientForm locale={locale} /></section>
      <section className="app-summary-strip" aria-label={copy.summaryAria}><article><Users aria-hidden="true" /><span><strong>{clients.length}</strong><small>{copy.activeClients}</small></span></article><article><UserCheck aria-hidden="true" /><span><strong>{realClients}</strong><small>{copy.realClients}</small></span></article><article><BriefcaseBusiness aria-hidden="true" /><span><strong>{projects}</strong><small>{copy.linkedProjects}</small></span></article></section>
      <ClientDirectory clients={clients} locale={locale} />
    </AppShell>
  );
}

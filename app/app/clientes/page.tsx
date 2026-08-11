import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BriefcaseBusiness, UserCheck, Users } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
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
  const [clients, unreadCount] = await Promise.all([
    getClientsData(workspace.organizationId),
    getUnreadNotificationCount(workspace.userId),
  ]);
  const realClients = clients.filter((client) => !client.isDemo).length;
  const projects = clients.reduce((total, client) => total + Number(client.projectCount), 0);

  return (
    <AppShell active="clients" title="Clientes" description="Carteira protegida por empresa" workspace={workspace} unreadCount={unreadCount}>
      <section className="app-page-intro"><div><span className="eyebrow">RELACIONAMENTOS COM CONTEXTO</span><h1>Clientes bem conduzidos começam com uma visão única.</h1><p>Centralize responsáveis, projetos e histórico sem misturar dados entre empresas.</p></div><ClientForm /></section>
      <section className="app-summary-strip" aria-label="Resumo da carteira"><article><Users aria-hidden="true" /><span><strong>{clients.length}</strong><small>clientes ativos</small></span></article><article><UserCheck aria-hidden="true" /><span><strong>{realClients}</strong><small>clientes reais</small></span></article><article><BriefcaseBusiness aria-hidden="true" /><span><strong>{projects}</strong><small>projetos vinculados</small></span></article></section>
      <ClientDirectory clients={clients} />
    </AppShell>
  );
}

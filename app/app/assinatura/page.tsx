import type { Metadata } from "next";
import { CreditCard, ReceiptText, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { requireSessionUser } from "@/app/session-auth";
import { hasPermission } from "@/lib/permissions";
import { getBillingOverview } from "@/lib/supabase/billing";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { findWorkspaceByEmail, getUnreadNotificationCount } from "@/lib/workspace";
import { AppShell } from "../components/app-shell";
import { BillingPlanSelector } from "../components/billing-plan-selector";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Planos e assinatura", description: "Gestão demonstrativa de planos do Prismivo.", robots: { index: false, follow: false } };

export default async function BillingPage() {
  const identity = await requireSessionUser("/app/assinatura");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  if (!isSupabaseConfigured() || !hasPermission(workspace.role, "billing.manage")) redirect("/app");
  const [billing, unreadCount] = await Promise.all([
    getBillingOverview(workspace.organizationId),
    getUnreadNotificationCount(workspace.userId),
  ]);
  const currentPlan = billing.plans.find((plan) => plan.code === (billing.subscription?.plan_code ?? workspace.plan));

  return <AppShell active="billing" title="Planos e assinatura" description="Cobrança demonstrativa e histórico" workspace={workspace} unreadCount={unreadCount}>
    <section className="app-page-intro compact-intro"><div><span className="eyebrow">MARCO 9 · GESTÃO COMERCIAL</span><h1>Planos claros, preços determinados no servidor.</h1><p>Explore o fluxo completo em modo demonstrativo. Nenhuma cobrança real, cartão ou dado financeiro é processado.</p></div></section>
    <section className="billing-current-grid">
      <article className="dashboard-panel"><div className="panel-heading"><div><span className="panel-kicker">PLANO ATUAL</span><h2>{currentPlan?.name ?? "Inicial"}</h2></div><CreditCard aria-hidden="true" /></div><strong>{billing.subscription ? statusLabel(billing.subscription.status) : "Sem assinatura registrada"}</strong><p>{billing.subscription ? `Ciclo ${billing.subscription.billing_cycle === "annual" ? "anual" : "mensal"} · modo ${billing.subscription.provider === "demo" ? "demonstrativo" : "integrado"}.` : "A empresa usa os limites gratuitos até escolher outro plano."}</p></article>
      <article className="dashboard-panel billing-safety"><div className="panel-heading"><div><span className="panel-kicker">SEGURANÇA FINANCEIRA</span><h2>Servidor como autoridade</h2></div><ShieldCheck aria-hidden="true" /></div><p>Preço, plano, organização e permissão são verificados novamente no banco. O navegador não consegue liberar recursos sozinho.</p></article>
    </section>
    <div className="dashboard-panel billing-plan-panel"><BillingPlanSelector plans={billing.plans} subscription={billing.subscription} /></div>
    <section className="dashboard-panel" aria-labelledby="billing-history-title"><div className="panel-heading"><div><span className="panel-kicker">HISTÓRICO</span><h2 id="billing-history-title">Eventos de cobrança</h2></div><ReceiptText aria-hidden="true" /></div>{billing.events.length === 0 ? <p className="empty-copy">As mudanças de plano demonstrativas aparecerão aqui.</p> : <div className="billing-event-list">{billing.events.map((event) => <article key={event.id}><div><strong>{eventLabel(event.type)}</strong><span>{formatDate(event.created_at)}</span></div><div><strong>{formatMoney(event.amount_cents)}</strong><span className="demo-badge">{event.status === "simulated" ? "Simulado" : event.status}</span></div></article>)}</div>}</section>
  </AppShell>;
}

function statusLabel(status: string) {
  return ({ trialing: "Demonstração ativa", active: "Ativo", past_due: "Pagamento pendente", cancelled: "Cancelado" } as Record<string, string>)[status] ?? status;
}

function eventLabel(type: string) {
  return type === "subscription.demo_activated" ? "Plano demonstrativo ativado" : type.replaceAll(".", " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

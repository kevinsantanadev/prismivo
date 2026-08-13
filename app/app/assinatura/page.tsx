import type { Metadata } from "next";
import { CreditCard, ReceiptText, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { requireSessionUser } from "@/app/session-auth";
import { hasPermission } from "@/lib/permissions";
import { getManagementCopy } from "@/lib/app-management-i18n";
import { toIntlLocale } from "@/lib/site-locale";
import { getRequestLocale } from "@/lib/site-locale-server";
import { getBillingOverview } from "@/lib/supabase/billing";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { findWorkspaceByEmail, getUnreadNotificationCount } from "@/lib/workspace";
import { AppShell } from "../components/app-shell";
import { BillingPlanSelector } from "../components/billing-plan-selector";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Planos e assinatura", description: "Gestão demonstrativa de planos do Prismivo.", robots: { index: false, follow: false } };

export default async function BillingPage() {
  const locale = await getRequestLocale();
  const copy = getManagementCopy(locale).billing;
  const identity = await requireSessionUser("/app/assinatura");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  if (!isSupabaseConfigured() || !hasPermission(workspace.role, "billing.manage")) redirect("/app");
  const [billing, unreadCount] = await Promise.all([
    getBillingOverview(workspace.organizationId),
    getUnreadNotificationCount(workspace.userId),
  ]);
  const currentPlan = billing.plans.find((plan) => plan.code === (billing.subscription?.plan_code ?? workspace.plan));

  return <AppShell active="billing" title={copy.navTitle} description={copy.navDescription} workspace={workspace} unreadCount={unreadCount}>
    <section className="app-page-intro compact-intro"><div><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p></div></section>
    <section className="billing-current-grid">
      <article className="dashboard-panel"><div className="panel-heading"><div><span className="panel-kicker">{copy.currentPlan}</span><h2>{currentPlan ? copy.planNames[currentPlan.code] : copy.starter}</h2></div><CreditCard aria-hidden="true" /></div><strong>{billing.subscription ? copy.statuses[billing.subscription.status] : copy.noSubscription}</strong><p>{billing.subscription ? copy.cycle(billing.subscription.billing_cycle === "annual" ? copy.annual : copy.monthly, billing.subscription.provider === "demo" ? copy.demo : copy.integrated) : copy.freeLimits}</p></article>
      <article className="dashboard-panel billing-safety"><div className="panel-heading"><div><span className="panel-kicker">{copy.financialSecurity}</span><h2>{copy.serverAuthority}</h2></div><ShieldCheck aria-hidden="true" /></div><p>{copy.safetyText}</p></article>
    </section>
    <div className="dashboard-panel billing-plan-panel"><BillingPlanSelector locale={locale} plans={billing.plans} subscription={billing.subscription} /></div>
    <section className="dashboard-panel" aria-labelledby="billing-history-title"><div className="panel-heading"><div><span className="panel-kicker">{copy.history}</span><h2 id="billing-history-title">{copy.events}</h2></div><ReceiptText aria-hidden="true" /></div>{billing.events.length === 0 ? <p className="empty-copy">{copy.noEvents}</p> : <div className="billing-event-list">{billing.events.map((event) => <article key={event.id}><div><strong>{event.type === "subscription.demo_activated" ? copy.demoActivated : event.type.replaceAll(".", " ")}</strong><span>{formatDate(event.created_at, locale)}</span></div><div><strong>{formatMoney(event.amount_cents, locale)}</strong><span className="demo-badge">{event.status === "simulated" ? copy.simulated : event.status}</span></div></article>)}</div>}</section>
  </AppShell>;
}

function formatDate(value: string, locale: Parameters<typeof toIntlLocale>[0]) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatMoney(cents: number, locale: Parameters<typeof toIntlLocale>[0]) {
  return new Intl.NumberFormat(toIntlLocale(locale), { style: "currency", currency: "BRL" }).format(cents / 100);
}

"use client";

import { Check, CheckCircle2, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BillingPlan, Subscription } from "@/lib/supabase/billing";

export function BillingPlanSelector({ plans, subscription }: { plans: BillingPlan[]; subscription: Subscription | null }) {
  const router = useRouter();
  const [cycle, setCycle] = useState<"monthly" | "annual">(subscription?.billing_cycle ?? "annual");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function select(planCode: BillingPlan["code"]) {
    if (loading) return;
    setLoading(planCode);
    setMessage("");
    setSuccess(false);
    try {
      const response = await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planCode, billingCycle: cycle }),
      });
      const result = await response.json() as { ok: boolean; error?: { message: string } };
      if (!response.ok || !result.ok) {
        setMessage(result.error?.message ?? "Não foi possível atualizar o plano.");
        return;
      }
      setSuccess(true);
      setMessage("Plano demonstrativo atualizado. Nenhuma cobrança foi realizada.");
      router.refresh();
    } catch {
      setMessage("A conexão falhou. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }

  return <section aria-labelledby="plan-selector-title">
    <div className="billing-selector-heading"><div><span className="panel-kicker">PLANOS</span><h2 id="plan-selector-title">Escolha o ritmo da operação</h2></div><div className="billing-toggle" role="group" aria-label="Período da assinatura"><button type="button" className={cycle === "monthly" ? "active" : ""} aria-pressed={cycle === "monthly"} onClick={() => setCycle("monthly")}>Mensal</button><button type="button" className={cycle === "annual" ? "active" : ""} aria-pressed={cycle === "annual"} onClick={() => setCycle("annual")}>Anual · 20% menor</button></div></div>
    <div className="app-billing-plans">{plans.map((plan) => {
      const active = subscription?.plan_code === plan.code;
      const price = cycle === "annual" ? Math.round(plan.annual_price_cents / 12) : plan.monthly_price_cents;
      return <article className={plan.code === "professional" ? "recommended-plan" : ""} key={plan.code}>
        {plan.code === "professional" && <span className="demo-badge">Recomendado</span>}
        <h3>{plan.name}</h3><p>{plan.description}</p><div className="billing-price"><span>R$</span><strong>{formatCents(price)}</strong><small>/mês</small></div>
        <ul><li><Check aria-hidden="true" />{limitLabel(plan.limits.clients, "clientes")}</li><li><Check aria-hidden="true" />{limitLabel(plan.limits.active_projects, "projetos ativos")}</li><li><Check aria-hidden="true" />{limitLabel(plan.limits.team_members, "pessoas na equipe")}</li></ul>
        <button className={active ? "button button-secondary" : "app-primary-button"} type="button" onClick={() => select(plan.code)} disabled={Boolean(loading) || active}>{loading === plan.code ? <><LoaderCircle className="spin" aria-hidden="true" />Atualizando…</> : active ? <><CheckCircle2 aria-hidden="true" />Plano atual</> : "Ativar demonstração"}</button>
      </article>;
    })}</div>
    {message && <div className={`form-message ${success ? "success" : ""}`} role="status">{success && <CheckCircle2 aria-hidden="true" />}{message}</div>}
  </section>;
}

function formatCents(value: number) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value / 100);
}

function limitLabel(value: number | undefined, subject: string) {
  if (value === -1) return `${capitalize(subject)} ilimitados`;
  return `${value ?? 0} ${subject}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

"use client";

import { Check, CheckCircle2, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getManagementCopy } from "@/lib/app-management-i18n";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";
import type { BillingPlan, Subscription } from "@/lib/supabase/billing";

export function BillingPlanSelector({ locale, plans, subscription }: { locale: SiteLocale; plans: BillingPlan[]; subscription: Subscription | null }) {
  const router = useRouter();
  const copy = getManagementCopy(locale).billing;
  const [cycle, setCycle] = useState<"monthly" | "annual">(subscription?.billing_cycle ?? "annual");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function select(planCode: BillingPlan["code"]) {
    if (loading) return;
    setLoading(planCode); setMessage(""); setSuccess(false);
    try {
      const response = await fetch("/api/billing/subscription", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ planCode, billingCycle: cycle }) });
      const result = await response.json() as { ok: boolean; error?: { message: string } };
      if (!response.ok || !result.ok) { setMessage(locale === "pt-BR" ? result.error?.message ?? copy.error : copy.error); return; }
      setSuccess(true); setMessage(copy.success); router.refresh();
    } catch { setMessage(copy.connectionError); } finally { setLoading(null); }
  }

  const subjectLabel = (value: number | undefined, subject: string) => value === -1 ? `${subject} ${copy.unlimited}` : `${value ?? 0} ${subject}`;

  return <section aria-labelledby="plan-selector-title">
    <div className="billing-selector-heading"><div><span className="panel-kicker">{copy.plans}</span><h2 id="plan-selector-title">{copy.choose}</h2></div><div className="billing-toggle" role="group" aria-label={copy.periodAria}><button type="button" className={cycle === "monthly" ? "active" : ""} aria-pressed={cycle === "monthly"} onClick={() => setCycle("monthly")}>{copy.monthlyButton}</button><button type="button" className={cycle === "annual" ? "active" : ""} aria-pressed={cycle === "annual"} onClick={() => setCycle("annual")}>{copy.annualButton}</button></div></div>
    <div className="app-billing-plans">{plans.map((plan) => {
      const active = subscription?.plan_code === plan.code;
      const price = cycle === "annual" ? Math.round(plan.annual_price_cents / 12) : plan.monthly_price_cents;
      return <article className={plan.code === "professional" ? "recommended-plan" : ""} key={plan.code}>
        {plan.code === "professional" && <span className="demo-badge">{copy.recommended}</span>}
        <h3>{copy.planNames[plan.code]}</h3><p>{copy.planDescriptions[plan.code]}</p><div className="billing-price"><span>R$</span><strong>{new Intl.NumberFormat(toIntlLocale(locale), { maximumFractionDigits: 0 }).format(price / 100)}</strong><small>{copy.perMonth}</small></div>
        <ul><li><Check aria-hidden="true" />{subjectLabel(plan.limits.clients, copy.clients)}</li><li><Check aria-hidden="true" />{subjectLabel(plan.limits.active_projects, copy.projects)}</li><li><Check aria-hidden="true" />{subjectLabel(plan.limits.team_members, copy.people)}</li></ul>
        <button className={active ? "button button-secondary" : "app-primary-button"} type="button" onClick={() => select(plan.code)} disabled={Boolean(loading) || active}>{loading === plan.code ? <><LoaderCircle className="spin" aria-hidden="true" />{copy.updating}</> : active ? <><CheckCircle2 aria-hidden="true" />{copy.current}</> : copy.activate}</button>
      </article>;
    })}</div>
    {message && <div className={`form-message ${success ? "success" : ""}`} role="status">{success && <CheckCircle2 aria-hidden="true" />}{message}</div>}
  </section>;
}

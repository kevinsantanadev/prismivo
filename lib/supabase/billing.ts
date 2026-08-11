import type { MutationResult } from "./mutations";
import { createSupabaseServerClient } from "./server";

export type BillingPlan = {
  code: "free" | "professional" | "scale";
  name: string;
  description: string;
  monthly_price_cents: number;
  annual_price_cents: number;
  currency: "BRL";
  limits: Record<string, number>;
  sort_order: number;
};

export type Subscription = {
  id: string;
  plan_code: BillingPlan["code"];
  billing_cycle: "monthly" | "annual";
  status: "trialing" | "active" | "past_due" | "cancelled";
  provider: "demo" | "stripe";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
};

export type BillingEvent = {
  id: string;
  type: string;
  amount_cents: number;
  currency: "BRL";
  status: "simulated" | "pending" | "paid" | "failed" | "refunded";
  created_at: string;
};

export async function getBillingOverview(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const [plansResult, subscriptionResult, eventsResult] = await Promise.all([
    supabase.from("plans").select("code, name, description, monthly_price_cents, annual_price_cents, currency, limits, sort_order").eq("active", true).order("sort_order"),
    supabase.from("subscriptions").select("id, plan_code, billing_cycle, status, provider, current_period_start, current_period_end, cancel_at_period_end").eq("organization_id", organizationId).maybeSingle(),
    supabase.from("billing_events").select("id, type, amount_cents, currency, status, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(20),
  ]);
  const error = plansResult.error ?? subscriptionResult.error ?? eventsResult.error;
  if (error) throw error;
  return {
    plans: (plansResult.data ?? []) as BillingPlan[],
    subscription: subscriptionResult.data as Subscription | null,
    events: (eventsResult.data ?? []) as BillingEvent[],
  };
}

export async function activateDemoSubscription(
  organizationId: string,
  planCode: BillingPlan["code"],
  billingCycle: "monthly" | "annual",
): Promise<MutationResult<Record<string, unknown>>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("activate_demo_subscription", {
    target_organization_id: organizationId,
    target_plan_code: planCode,
    target_billing_cycle: billingCycle,
  });
  if (error?.code === "42501") return { ok: false, code: "FORBIDDEN", message: "Seu papel não permite alterar a assinatura.", status: 403 };
  if (error) return { ok: false, code: "BILLING_UPDATE_FAILED", message: "Não foi possível atualizar o plano demonstrativo.", status: 500 };
  return { ok: true, data: (data ?? {}) as Record<string, unknown> };
}

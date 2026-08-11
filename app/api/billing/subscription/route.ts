import { getSessionUser } from "@/app/session-auth";
import { apiError, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { activateDemoSubscription } from "@/lib/supabase/billing";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { billingSubscriptionSchema, zodFieldErrors } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Não foi possível validar a origem da solicitação.", 403);
  if (!isJsonRequest(request)) return apiError("INVALID_CONTENT_TYPE", "Envie os dados no formato esperado.", 415);
  if (!isSupabaseConfigured()) return apiError("BILLING_UNAVAILABLE", "A gestão de planos exige o ambiente de dados seguro.", 503);

  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);
  if (!hasPermission(workspace.role, "billing.manage")) return apiError("FORBIDDEN", "Seu papel não permite alterar a assinatura.", 403);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Não foi possível interpretar os dados enviados.", 400);
  }
  const parsed = billingSubscriptionSchema.safeParse(payload);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Revise o plano e o período escolhidos.", 422, zodFieldErrors(parsed.error));
  return supabaseMutationResponse(await activateDemoSubscription(workspace.organizationId, parsed.data.planCode, parsed.data.billingCycle));
}

import { getSessionUser } from "@/app/session-auth";
import { apiError, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createDeliverableRecord } from "@/lib/supabase/deliverables";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { deliverableSchema, zodFieldErrors } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  if (!isJsonRequest(request)) return apiError("INVALID_CONTENT_TYPE", "Envie os dados no formato esperado.", 415);
  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);
  if (!hasPermission(workspace.role, "deliverables.write")) return apiError("FORBIDDEN", "Seu papel não permite criar entregáveis.", 403);
  if (!isSupabaseConfigured()) return apiError("DATA_SERVICE_REQUIRED", "Esta função exige o ambiente de dados seguro.", 503);

  let payload: unknown;
  try { payload = await request.json(); } catch { return apiError("INVALID_JSON", "Dados inválidos.", 400); }
  const parsed = deliverableSchema.safeParse(payload);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Revise os dados do entregável.", 422, zodFieldErrors(parsed.error));
  const { id } = await context.params;
  return supabaseMutationResponse(await createDeliverableRecord(workspace, id, parsed.data), 201);
}

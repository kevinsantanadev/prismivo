import { getSessionUser } from "@/app/session-auth";
import { apiError, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { updateContentStatus } from "@/lib/supabase/content";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { contentStatusSchema, zodFieldErrors } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Não foi possível validar a origem da solicitação.", 403);
  if (!isJsonRequest(request)) return apiError("INVALID_CONTENT_TYPE", "Envie os dados no formato esperado.", 415);
  if (!isSupabaseConfigured()) return apiError("CONTENT_UNAVAILABLE", "O estúdio de conteúdo exige o ambiente de dados seguro.", 503);

  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);
  if (!hasPermission(workspace.role, "content.write")) return apiError("FORBIDDEN", "Seu papel não permite alterar conteúdo.", 403);

  const { id } = await context.params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Não foi possível interpretar os dados enviados.", 400);
  }
  const parsed = contentStatusSchema.safeParse(payload);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Estado de conteúdo inválido.", 422, zodFieldErrors(parsed.error));
  return supabaseMutationResponse(await updateContentStatus(workspace, id, parsed.data.status));
}

import { getSessionUser } from "@/app/session-auth";
import { apiError, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { createTeamInvitation } from "@/lib/supabase/team";
import { invitationSchema, zodFieldErrors } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  if (!isJsonRequest(request)) return apiError("INVALID_CONTENT_TYPE", "Envie os dados no formato esperado.", 415);
  if (!isSupabaseConfigured()) return apiError("FEATURE_UNAVAILABLE", "Convites exigem o ambiente independente do Prismivo.", 503);
  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);
  if (!hasPermission(workspace.role, "team.manage")) return apiError("FORBIDDEN", "Seu papel não permite gerenciar a equipe.", 403);
  let payload: unknown;
  try { payload = await request.json(); } catch { return apiError("INVALID_JSON", "Dados inválidos.", 400); }
  const parsed = invitationSchema.safeParse(payload);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Revise os campos destacados.", 422, zodFieldErrors(parsed.error));
  return supabaseMutationResponse(await createTeamInvitation(workspace, parsed.data), 201);
}

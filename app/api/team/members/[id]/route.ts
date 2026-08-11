import { getSessionUser } from "@/app/session-auth";
import { apiError, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { removeTeamMember, updateTeamMember } from "@/lib/supabase/team";
import { memberAccessSchema, zodFieldErrors } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";

async function authorize() {
  if (!isSupabaseConfigured()) return { response: apiError("FEATURE_UNAVAILABLE", "Equipe indisponível neste ambiente.", 503) };
  const identity = await getSessionUser();
  if (!identity) return { response: apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401) };
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return { response: apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409) };
  if (!hasPermission(workspace.role, "team.manage")) return { response: apiError("FORBIDDEN", "Seu papel não permite gerenciar a equipe.", 403) };
  return { workspace };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  if (!isJsonRequest(request)) return apiError("INVALID_CONTENT_TYPE", "Envie os dados no formato esperado.", 415);
  const authorized = await authorize();
  if ("response" in authorized) return authorized.response;
  let payload: unknown;
  try { payload = await request.json(); } catch { return apiError("INVALID_JSON", "Dados inválidos.", 400); }
  const parsed = memberAccessSchema.safeParse(payload);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Revise os campos destacados.", 422, zodFieldErrors(parsed.error));
  const { id } = await context.params;
  return supabaseMutationResponse(await updateTeamMember(authorized.workspace, { membershipId: id, ...parsed.data }));
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  const authorized = await authorize();
  if ("response" in authorized) return authorized.response;
  const { id } = await context.params;
  return supabaseMutationResponse(await removeTeamMember(authorized.workspace, id));
}

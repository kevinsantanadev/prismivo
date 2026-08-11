import { getSessionUser } from "@/app/session-auth";
import { apiError, isSameOriginRequest } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { revokeTeamInvitation } from "@/lib/supabase/team";
import { findWorkspaceByEmail } from "@/lib/workspace";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  if (!isSupabaseConfigured()) return apiError("FEATURE_UNAVAILABLE", "Convites indisponíveis neste ambiente.", 503);
  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);
  if (!hasPermission(workspace.role, "team.manage")) return apiError("FORBIDDEN", "Seu papel não permite gerenciar a equipe.", 403);
  const { id } = await context.params;
  if (!id) return apiError("INVITATION_REQUIRED", "Convite não informado.", 422);
  return supabaseMutationResponse(await revokeTeamInvitation(workspace, id));
}

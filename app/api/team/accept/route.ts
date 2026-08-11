import { getSessionUser } from "@/app/session-auth";
import { apiError, isJsonRequest, isSameOriginRequest } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { acceptTeamInvitation } from "@/lib/supabase/team";
import { invitationTokenSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  if (!isJsonRequest(request)) return apiError("INVALID_CONTENT_TYPE", "Envie os dados no formato esperado.", 415);
  if (!isSupabaseConfigured()) return apiError("FEATURE_UNAVAILABLE", "Convites indisponíveis neste ambiente.", 503);
  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre com o e-mail que recebeu o convite.", 401);
  let payload: unknown;
  try { payload = await request.json(); } catch { return apiError("INVALID_JSON", "Dados inválidos.", 400); }
  const parsed = invitationTokenSchema.safeParse(payload);
  if (!parsed.success) return apiError("INVITATION_INVALID", "Convite inválido ou expirado.", 422);
  return supabaseMutationResponse(await acceptTeamInvitation(parsed.data.token));
}

import { getSessionUser } from "@/app/session-auth";
import { apiError, isSameOriginRequest } from "@/lib/api";
import { exceedsMultipartLimit, validateUploadedFile } from "@/lib/file-validation";
import { hasPermission } from "@/lib/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { createTicketAttachmentRecord } from "@/lib/supabase/ticket-attachments";
import { findWorkspaceByEmail } from "@/lib/workspace";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  if (exceedsMultipartLimit(request)) return apiError("FILE_TOO_LARGE", "O arquivo deve ter no máximo 5 MB.", 413);
  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);
  if (!hasPermission(workspace.role, "support.write")) return apiError("FORBIDDEN", "Seu papel não permite anexar arquivos.", 403);
  if (!isSupabaseConfigured()) return apiError("DATA_SERVICE_REQUIRED", "Esta função exige o ambiente de dados seguro.", 503);

  let formData: FormData;
  try { formData = await request.formData(); } catch { return apiError("INVALID_FORM", "Não foi possível ler o arquivo enviado.", 400); }
  const validated = await validateUploadedFile(formData.get("file"));
  if (!validated.ok) return apiError(validated.code, validated.message, validated.status);
  const { id } = await context.params;
  return supabaseMutationResponse(await createTicketAttachmentRecord({
    workspace,
    ticketId: id,
    originalName: validated.originalName,
    contentType: validated.file.type,
    sizeBytes: validated.file.size,
    bytes: validated.bytes,
  }), 201);
}

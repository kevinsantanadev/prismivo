import { getSessionUser } from "@/app/session-auth";
import { apiError, isSameOriginRequest } from "@/lib/api";
import { exceedsMultipartLimit, validateUploadedFile } from "@/lib/file-validation";
import { hasPermission } from "@/lib/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createDeliverableVersionRecord, getDeliverableUploadContext } from "@/lib/supabase/deliverables";
import { deleteSupabaseFile, uploadSupabaseFile } from "@/lib/supabase/files";
import { supabaseMutationResponse } from "@/lib/supabase/http";
import { deliverableVersionSchema, zodFieldErrors } from "@/lib/validation";
import { findWorkspaceByEmail } from "@/lib/workspace";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  if (exceedsMultipartLimit(request)) return apiError("FILE_TOO_LARGE", "O arquivo deve ter no máximo 5 MB.", 413);
  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);
  if (!hasPermission(workspace.role, "deliverables.write") || !hasPermission(workspace.role, "files.write")) {
    return apiError("FORBIDDEN", "Seu papel não permite criar versões.", 403);
  }
  if (!isSupabaseConfigured()) return apiError("DATA_SERVICE_REQUIRED", "Esta função exige o ambiente de dados seguro.", 503);

  let formData: FormData;
  try { formData = await request.formData(); } catch { return apiError("INVALID_FORM", "Não foi possível ler os dados enviados.", 400); }
  const validatedFile = await validateUploadedFile(formData.get("file"));
  if (!validatedFile.ok) return apiError(validatedFile.code, validatedFile.message, validatedFile.status);
  const parsed = deliverableVersionSchema.safeParse({
    summary: String(formData.get("summary") ?? ""),
    requestApproval: String(formData.get("requestApproval") ?? "false"),
  });
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Revise os dados da versão.", 422, zodFieldErrors(parsed.error));

  const { id } = await context.params;
  let uploadContext: Awaited<ReturnType<typeof getDeliverableUploadContext>>;
  try { uploadContext = await getDeliverableUploadContext(workspace.organizationId, id); }
  catch { return apiError("DELIVERABLE_LOOKUP_FAILED", "Não foi possível localizar o entregável.", 500); }
  if (!uploadContext) return apiError("DELIVERABLE_NOT_FOUND", "Entregável não encontrado.", 404);

  const upload = await uploadSupabaseFile({
    workspace,
    projectId: uploadContext.projectId,
    originalName: validatedFile.originalName,
    contentType: validatedFile.file.type,
    sizeBytes: validatedFile.file.size,
    bytes: validatedFile.bytes,
  });
  if (!upload.ok) return supabaseMutationResponse(upload, 201);

  const result = await createDeliverableVersionRecord(workspace, id, {
    fileId: upload.data.id,
    summary: parsed.data.summary,
    requestApproval: parsed.data.requestApproval,
  });
  if (!result.ok) await deleteSupabaseFile(workspace, upload.data.id);
  return supabaseMutationResponse(result, 201);
}

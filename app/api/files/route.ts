import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/app/session-auth";
import { getDb } from "@/db";
import { activities, files, projects } from "@/db/schema";
import { apiError, apiSuccess, isSameOriginRequest } from "@/lib/api";
import { exceedsMultipartLimit, validateUploadedFile } from "@/lib/file-validation";
import { hasPermission } from "@/lib/permissions";
import { getPrivateBucket } from "@/lib/storage";
import { findWorkspaceByEmail } from "@/lib/workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { uploadSupabaseFile } from "@/lib/supabase/files";
import { supabaseMutationResponse } from "@/lib/supabase/http";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  if (exceedsMultipartLimit(request)) return apiError("FILE_TOO_LARGE", "O arquivo deve ter no máximo 5 MB.", 413);
  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);
  if (!hasPermission(workspace.role, "files.write")) return apiError("FORBIDDEN", "Seu papel não permite enviar arquivos.", 403);
  let formData: FormData;
  try { formData = await request.formData(); } catch { return apiError("INVALID_FORM", "Não foi possível ler o arquivo enviado.", 400); }
  const validated = await validateUploadedFile(formData.get("file"));
  if (!validated.ok) return apiError(validated.code, validated.message, validated.status);
  const { file: entry, originalName, bytes } = validated;
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (isSupabaseConfigured()) {
    return supabaseMutationResponse(await uploadSupabaseFile({
      workspace,
      projectId: projectId || undefined,
      originalName,
      contentType: entry.type,
      sizeBytes: entry.size,
      bytes,
    }), 201);
  }
  const db = getDb();
  if (projectId) {
    const [ownedProject] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, projectId), eq(projects.organizationId, workspace.organizationId), eq(projects.status, "active"))).limit(1);
    if (!ownedProject) return apiError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
  }
  const fileId = `fil_${crypto.randomUUID()}`;
  const storageKey = `${workspace.organizationId}/${projectId || "general"}/${fileId}`;
  const bucket = getPrivateBucket();
  try {
    await bucket.put(storageKey, bytes, { httpMetadata: { contentType: entry.type }, customMetadata: { fileId, organizationId: workspace.organizationId } });
    await db.batch([
      db.insert(files).values({ id: fileId, organizationId: workspace.organizationId, projectId: projectId || null, uploadedByUserId: workspace.userId, storageKey, originalName, contentType: entry.type, sizeBytes: entry.size }),
      db.insert(activities).values({ id: `act_${crypto.randomUUID()}`, organizationId: workspace.organizationId, actorUserId: workspace.userId, type: "file.uploaded", title: "Arquivo protegido enviado", detail: originalName, resourceType: "file", resourceId: fileId }),
    ]);
  } catch (error) {
    await bucket.delete(storageKey).catch(() => undefined);
    console.error("file_upload_failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return apiError("FILE_UPLOAD_FAILED", "Não foi possível salvar o arquivo agora.", 500);
  }
  return apiSuccess({ id: fileId }, { status: 201 });
}

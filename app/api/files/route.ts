import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/app/session-auth";
import { getDb } from "@/db";
import { activities, files, projects } from "@/db/schema";
import { apiError, apiSuccess, isSameOriginRequest } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { getPrivateBucket } from "@/lib/storage";
import { findWorkspaceByEmail } from "@/lib/workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { uploadSupabaseFile } from "@/lib/supabase/files";
import { supabaseMutationResponse } from "@/lib/supabase/http";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILES: Record<string, string[]> = {
  "application/pdf": ["pdf"], "image/png": ["png"], "image/jpeg": ["jpg", "jpeg"],
  "text/plain": ["txt", "md"], "text/markdown": ["md"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
};

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_FILE_BYTES + 250_000) return apiError("FILE_TOO_LARGE", "O arquivo deve ter no máximo 5 MB.", 413);
  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);
  if (!hasPermission(workspace.role, "files.write")) return apiError("FORBIDDEN", "Seu papel não permite enviar arquivos.", 403);
  let formData: FormData;
  try { formData = await request.formData(); } catch { return apiError("INVALID_FORM", "Não foi possível ler o arquivo enviado.", 400); }
  const entry = formData.get("file");
  if (!(entry instanceof File)) return apiError("FILE_REQUIRED", "Selecione um arquivo.", 422);
  if (entry.size === 0 || entry.size > MAX_FILE_BYTES) return apiError("FILE_SIZE_INVALID", "O arquivo deve ter entre 1 byte e 5 MB.", 422);
  const originalName = safeFileName(entry.name);
  const extension = originalName.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_FILES[entry.type]?.includes(extension)) return apiError("FILE_TYPE_NOT_ALLOWED", "Envie PDF, PNG, JPG, TXT, Markdown ou DOCX.", 422);
  const bytes = await entry.arrayBuffer();
  if (!hasExpectedSignature(entry.type, new Uint8Array(bytes))) return apiError("FILE_SIGNATURE_INVALID", "O conteúdo do arquivo não corresponde ao formato informado.", 422);
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
    const [ownedProject] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, projectId), eq(projects.organizationId, workspace.organizationId))).limit(1);
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

function safeFileName(value: string) { const base = value.split(/[\\/]/).pop() || "arquivo"; return base.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 180) || "arquivo"; }
function hasExpectedSignature(contentType: string, bytes: Uint8Array) {
  if (contentType === "application/pdf") return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  if (contentType === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (contentType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType.includes("wordprocessingml")) return bytes[0] === 0x50 && bytes[1] === 0x4b;
  return contentType === "text/plain" || contentType === "text/markdown";
}

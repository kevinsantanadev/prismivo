import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/app/session-auth";
import { getDb } from "@/db";
import { files } from "@/db/schema";
import { apiError } from "@/lib/api";
import { getPrivateBucket } from "@/lib/storage";
import { findWorkspaceByEmail } from "@/lib/workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { downloadSupabaseFile } from "@/lib/supabase/files";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);
  const { id } = await context.params;
  if (isSupabaseConfigured()) {
    const result = await downloadSupabaseFile(workspace, id);
    if (!result.ok) return apiError(result.code, result.message, result.status);
    const fallbackName = result.data.originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    return new Response(result.data.body, { headers: { "content-type": result.data.contentType, "content-length": String(result.data.size), "content-disposition": `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(result.data.originalName)}`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
  }
  const [file] = await getDb().select({ storageKey: files.storageKey, originalName: files.originalName, contentType: files.contentType }).from(files)
    .where(and(eq(files.id, id), eq(files.organizationId, workspace.organizationId), eq(files.status, "available"))).limit(1);
  if (!file) return apiError("FILE_NOT_FOUND", "Arquivo não encontrado.", 404);
  const object = await getPrivateBucket().get(file.storageKey);
  if (!object) return apiError("FILE_NOT_FOUND", "Arquivo não encontrado.", 404);
  const body = await object.arrayBuffer();
  const fallbackName = file.originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return new Response(body, { headers: { "content-type": file.contentType, "content-length": String(object.size), "content-disposition": `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(file.originalName)}`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
}

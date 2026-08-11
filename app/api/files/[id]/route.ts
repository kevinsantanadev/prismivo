import { and, eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/app/session-auth";
import { getDb } from "@/db";
import { activities, files } from "@/db/schema";
import { apiError, apiSuccess, isSameOriginRequest } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { getPrivateBucket } from "@/lib/storage";
import { findWorkspaceByEmail } from "@/lib/workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { deleteSupabaseFile } from "@/lib/supabase/files";
import { supabaseMutationResponse } from "@/lib/supabase/http";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return apiError("INVALID_ORIGIN", "Origem da solicitação inválida.", 403);
  const identity = await getSessionUser();
  if (!identity) return apiError("AUTH_REQUIRED", "Entre novamente para continuar.", 401);
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) return apiError("ONBOARDING_REQUIRED", "Conclua a configuração da empresa.", 409);
  if (!hasPermission(workspace.role, "files.write")) return apiError("FORBIDDEN", "Seu papel não permite remover arquivos.", 403);
  const { id } = await context.params;
  if (isSupabaseConfigured()) {
    return supabaseMutationResponse(await deleteSupabaseFile(workspace, id));
  }
  const db = getDb();
  const [file] = await db.select({ storageKey: files.storageKey, originalName: files.originalName, uploadedByUserId: files.uploadedByUserId }).from(files)
    .where(and(eq(files.id, id), eq(files.organizationId, workspace.organizationId), eq(files.status, "available"))).limit(1);
  if (!file) return apiError("FILE_NOT_FOUND", "Arquivo não encontrado.", 404);
  if (workspace.role !== "owner" && file.uploadedByUserId !== workspace.userId) return apiError("FORBIDDEN", "Você não pode excluir este arquivo.", 403);
  try {
    await db.batch([
      db.update(files).set({ status: "deleted", deletedAt: sql`CURRENT_TIMESTAMP` }).where(and(eq(files.id, id), eq(files.organizationId, workspace.organizationId))),
      db.insert(activities).values({ id: `act_${crypto.randomUUID()}`, organizationId: workspace.organizationId, actorUserId: workspace.userId, type: "file.deleted", title: "Arquivo removido", detail: file.originalName, resourceType: "file", resourceId: id }),
    ]);
    await getPrivateBucket().delete(file.storageKey);
  } catch (error) {
    console.error("file_delete_failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return apiError("FILE_DELETE_FAILED", "Não foi possível remover o arquivo agora.", 500);
  }
  return apiSuccess({ id, deleted: true });
}

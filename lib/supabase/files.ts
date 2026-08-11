import type { MutationResult } from "./mutations";
import { createSupabaseServerClient } from "./server";

type Workspace = {
  userId: string;
  organizationId: string;
  role: string;
};

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "prismivo-files";

export async function uploadSupabaseFile(input: {
  workspace: Workspace;
  projectId?: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  bytes: ArrayBuffer;
}): Promise<MutationResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient();
  if (input.projectId) {
    const { data, error } = await supabase.from("projects").select("id").eq("organization_id", input.workspace.organizationId).eq("id", input.projectId).maybeSingle();
    if (error) return failed();
    if (!data) return fail("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
  }

  const id = `fil_${crypto.randomUUID()}`;
  const storageKey = `${input.workspace.organizationId}/${input.projectId || "general"}/${id}/${storageName(input.originalName)}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storageKey, input.bytes, {
    contentType: input.contentType,
    upsert: false,
  });
  if (uploadError) return failed("FILE_UPLOAD_FAILED", "Não foi possível salvar o arquivo agora.");

  const { error: metadataError } = await supabase.from("files").insert({
    id,
    organization_id: input.workspace.organizationId,
    project_id: input.projectId || null,
    uploaded_by_user_id: input.workspace.userId,
    storage_key: storageKey,
    original_name: input.originalName,
    content_type: input.contentType,
    size_bytes: input.sizeBytes,
  });
  if (metadataError) {
    await supabase.storage.from(BUCKET).remove([storageKey]);
    return failed("FILE_UPLOAD_FAILED", "Não foi possível salvar o arquivo agora.");
  }

  await supabase.from("activities").insert({ id: `act_${crypto.randomUUID()}`, organization_id: input.workspace.organizationId, actor_user_id: input.workspace.userId, type: "file.uploaded", title: "Arquivo protegido enviado", detail: input.originalName, resource_type: "file", resource_id: id });
  return success({ id });
}

export async function deleteSupabaseFile(workspace: Workspace, id: string): Promise<MutationResult<{ id: string; deleted: true }>> {
  const supabase = await createSupabaseServerClient();
  const { data: file, error: lookupError } = await supabase.from("files").select("storage_key, original_name, uploaded_by_user_id").eq("organization_id", workspace.organizationId).eq("id", id).eq("status", "available").maybeSingle();
  if (lookupError) return failed();
  if (!file) return fail("FILE_NOT_FOUND", "Arquivo não encontrado.", 404);
  if (workspace.role !== "owner" && file.uploaded_by_user_id !== workspace.userId) return fail("FORBIDDEN", "Você não pode excluir este arquivo.", 403);

  const { error } = await supabase.from("files").update({ status: "deleted", deleted_at: new Date().toISOString() }).eq("organization_id", workspace.organizationId).eq("id", id);
  if (error) return failed("FILE_DELETE_FAILED", "Não foi possível remover o arquivo agora.");
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([file.storage_key]);
  if (storageError) return failed("FILE_DELETE_FAILED", "O registro foi atualizado, mas o arquivo ainda precisa ser removido do armazenamento.");
  await supabase.from("activities").insert({ id: `act_${crypto.randomUUID()}`, organization_id: workspace.organizationId, actor_user_id: workspace.userId, type: "file.deleted", title: "Arquivo removido", detail: file.original_name, resource_type: "file", resource_id: id });
  return success({ id, deleted: true });
}

export async function downloadSupabaseFile(workspace: Workspace, id: string): Promise<MutationResult<{ body: ArrayBuffer; originalName: string; contentType: string; size: number }>> {
  const supabase = await createSupabaseServerClient();
  const { data: file, error: lookupError } = await supabase.from("files").select("storage_key, original_name, content_type").eq("organization_id", workspace.organizationId).eq("id", id).eq("status", "available").maybeSingle();
  if (lookupError) return failed();
  if (!file) return fail("FILE_NOT_FOUND", "Arquivo não encontrado.", 404);
  const { data, error } = await supabase.storage.from(BUCKET).download(file.storage_key);
  if (error || !data) return fail("FILE_NOT_FOUND", "Arquivo não encontrado.", 404);
  const body = await data.arrayBuffer();
  return success({ body, originalName: file.original_name, contentType: file.content_type, size: data.size });
}

function storageName(value: string) {
  return value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "arquivo";
}

function success<T>(data: T): MutationResult<T> { return { ok: true, data }; }
function fail<T>(code: string, message: string, status: number): MutationResult<T> { return { ok: false, code, message, status }; }
function failed<T>(code = "FILE_OPERATION_FAILED", message = "Não foi possível concluir a operação agora."): MutationResult<T> { return fail(code, message, 500); }

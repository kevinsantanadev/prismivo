import type { MutationResult } from "./mutations";
import { createSupabaseServerClient } from "./server";

type Workspace = { userId: string; organizationId: string; role: string };

export type DeliverableRecord = {
  id: string;
  title: string;
  description: string;
  status: "draft" | "in_review" | "approved" | "changes_requested" | "archived";
  currentVersionNumber: number;
  createdAt: string;
  creatorName: string;
  versions: Array<{
    id: string;
    versionNumber: number;
    summary: string;
    createdAt: string;
    creatorName: string;
    fileId: string;
    originalName: string;
    sizeBytes: number;
  }>;
  comments: Array<{
    id: string;
    body: string;
    versionId: string | null;
    createdAt: string;
    authorName: string;
  }>;
};

export async function getProjectDeliverables(organizationId: string, projectId: string): Promise<DeliverableRecord[]> {
  const supabase = await createSupabaseServerClient();
  const { data: items, error } = await supabase
    .from("deliverables")
    .select("id, title, description, status, current_version_number, created_at, created_by_user_id")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!items?.length) return [];

  const ids = items.map((item) => item.id);
  const [versionsResult, commentsResult] = await Promise.all([
    supabase
      .from("deliverable_versions")
      .select("id, deliverable_id, version_number, summary, created_at, created_by_user_id, file_id, file:files!inner(original_name, size_bytes, status)")
      .eq("organization_id", organizationId)
      .in("deliverable_id", ids)
      .order("version_number", { ascending: false }),
    supabase
      .from("deliverable_comments")
      .select("id, deliverable_id, version_id, body, created_at, author_user_id")
      .eq("organization_id", organizationId)
      .in("deliverable_id", ids)
      .order("created_at", { ascending: true }),
  ]);
  if (versionsResult.error) throw versionsResult.error;
  if (commentsResult.error) throw commentsResult.error;

  const userIds = [
    ...items.map((item) => item.created_by_user_id),
    ...(versionsResult.data ?? []).map((item) => item.created_by_user_id),
    ...(commentsResult.data ?? []).map((item) => item.author_user_id),
  ];
  const names = await profileNames(userIds);

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    status: item.status,
    currentVersionNumber: item.current_version_number,
    createdAt: item.created_at,
    creatorName: names.get(item.created_by_user_id) ?? "Membro",
    versions: (versionsResult.data ?? [])
      .filter((version) => version.deliverable_id === item.id && one(version.file)?.status === "available")
      .map((version) => ({
        id: version.id,
        versionNumber: version.version_number,
        summary: version.summary,
        createdAt: version.created_at,
        creatorName: names.get(version.created_by_user_id) ?? "Membro",
        fileId: version.file_id,
        originalName: one(version.file)?.original_name ?? "Arquivo protegido",
        sizeBytes: Number(one(version.file)?.size_bytes ?? 0),
      })),
    comments: (commentsResult.data ?? [])
      .filter((comment) => comment.deliverable_id === item.id)
      .map((comment) => ({
        id: comment.id,
        body: comment.body,
        versionId: comment.version_id,
        createdAt: comment.created_at,
        authorName: names.get(comment.author_user_id) ?? "Membro",
      })),
  })) as DeliverableRecord[];
}

export async function getDeliverableUploadContext(organizationId: string, deliverableId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("deliverables")
    .select("id, project_id")
    .eq("organization_id", organizationId)
    .eq("id", deliverableId)
    .maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, projectId: data.project_id } : null;
}

export async function createDeliverableRecord(
  workspace: Workspace,
  projectId: string,
  input: { title: string; description: string },
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", workspace.organizationId)
    .eq("id", projectId)
    .maybeSingle();
  if (projectError) return failed();
  if (!project) return fail("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);

  const id = `del_${crypto.randomUUID()}`;
  const { error } = await supabase.from("deliverables").insert({
    id,
    organization_id: workspace.organizationId,
    project_id: projectId,
    created_by_user_id: workspace.userId,
    title: input.title,
    description: input.description,
  });
  if (error) return failed("DELIVERABLE_CREATE_FAILED", "Não foi possível criar o entregável.");
  await recordActivity(workspace, "deliverable.created", "Entregável criado", `${input.title} foi adicionado a ${project.name}.`, id);
  return success({ id });
}

export async function createDeliverableVersionRecord(
  workspace: Workspace,
  deliverableId: string,
  input: { fileId: string; summary: string; requestApproval: boolean },
): Promise<MutationResult<Record<string, unknown>>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_deliverable_version", {
    target_deliverable_id: deliverableId,
    target_file_id: input.fileId,
    target_summary: input.summary,
    target_request_approval: input.requestApproval,
  });
  if (error?.code === "42501") return fail("FORBIDDEN", "Seu papel não permite criar versões.", 403);
  if (error?.code === "P0002") return fail("DELIVERABLE_NOT_FOUND", "Entregável ou arquivo não encontrado.", 404);
  if (error) return failed("DELIVERABLE_VERSION_FAILED", "Não foi possível registrar a nova versão.");
  return success((data ?? {}) as Record<string, unknown>);
}

export async function addDeliverableCommentRecord(
  workspace: Workspace,
  deliverableId: string,
  input: { body: string; versionId?: string },
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: deliverable, error: deliverableError } = await supabase
    .from("deliverables")
    .select("id, title")
    .eq("organization_id", workspace.organizationId)
    .eq("id", deliverableId)
    .maybeSingle();
  if (deliverableError) return failed();
  if (!deliverable) return fail("DELIVERABLE_NOT_FOUND", "Entregável não encontrado.", 404);

  if (input.versionId) {
    const { data: version, error } = await supabase
      .from("deliverable_versions")
      .select("id")
      .eq("organization_id", workspace.organizationId)
      .eq("deliverable_id", deliverableId)
      .eq("id", input.versionId)
      .maybeSingle();
    if (error) return failed();
    if (!version) return fail("VERSION_NOT_FOUND", "Versão não encontrada.", 404);
  }

  const id = `dcm_${crypto.randomUUID()}`;
  const { error } = await supabase.from("deliverable_comments").insert({
    id,
    deliverable_id: deliverableId,
    version_id: input.versionId || null,
    organization_id: workspace.organizationId,
    author_user_id: workspace.userId,
    body: input.body,
  });
  if (error) return failed("COMMENT_CREATE_FAILED", "Não foi possível registrar o comentário.");
  await recordActivity(workspace, "deliverable.comment_added", "Comentário no entregável", deliverable.title, deliverableId);
  return success({ id });
}

async function profileNames(userIds: string[]) {
  const ids = [...new Set(userIds.filter(Boolean))];
  const names = new Map<string, string>();
  if (!ids.length) return names;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("profiles").select("id, name").in("id", ids);
  if (error) throw error;
  for (const profile of data ?? []) names.set(profile.id, profile.name);
  return names;
}

async function recordActivity(workspace: Workspace, type: string, title: string, detail: string, resourceId: string) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("activities").insert({
    id: `act_${crypto.randomUUID()}`,
    organization_id: workspace.organizationId,
    actor_user_id: workspace.userId,
    type,
    title,
    detail,
    resource_type: "deliverable",
    resource_id: resourceId,
  });
}

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
function success<T>(data: T): MutationResult<T> { return { ok: true, data }; }
function fail<T>(code: string, message: string, status: number): MutationResult<T> { return { ok: false, code, message, status }; }
function failed<T>(code = "DELIVERABLE_OPERATION_FAILED", message = "Não foi possível concluir a operação agora."): MutationResult<T> { return fail(code, message, 500); }

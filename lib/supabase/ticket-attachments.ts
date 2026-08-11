import type { MutationResult } from "./mutations";
import { deleteSupabaseFile, uploadSupabaseFile } from "./files";
import { createSupabaseServerClient } from "./server";

type Workspace = { userId: string; organizationId: string; role: string };

export async function getTicketAttachments(organizationId: string, ticketId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ticket_attachments")
    .select("id, created_at, uploaded_by_user_id, file:files!inner(id, original_name, content_type, size_bytes, status)")
    .eq("organization_id", organizationId)
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? [])
    .filter((item) => one(item.file)?.status === "available")
    .map((item) => ({
      id: item.id,
      fileId: one(item.file)?.id ?? "",
      originalName: one(item.file)?.original_name ?? "Arquivo protegido",
      contentType: one(item.file)?.content_type ?? "application/octet-stream",
      sizeBytes: Number(one(item.file)?.size_bytes ?? 0),
      createdAt: item.created_at,
      uploadedByUserId: item.uploaded_by_user_id,
    }));
}

export async function createTicketAttachmentRecord(input: {
  workspace: Workspace;
  ticketId: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  bytes: ArrayBuffer;
}): Promise<MutationResult<{ id: string; fileId: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select("id, protocol, status")
    .eq("organization_id", input.workspace.organizationId)
    .eq("id", input.ticketId)
    .maybeSingle();
  if (ticketError) return failed();
  if (!ticket) return fail("TICKET_NOT_FOUND", "Atendimento não encontrado.", 404);
  if (ticket.status === "closed") return fail("TICKET_CLOSED", "Reabra o atendimento antes de anexar arquivos.", 409);

  const upload = await uploadSupabaseFile({
    workspace: input.workspace,
    originalName: input.originalName,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    bytes: input.bytes,
  });
  if (!upload.ok) return upload;

  const id = `tat_${crypto.randomUUID()}`;
  const { error } = await supabase.from("ticket_attachments").insert({
    id,
    ticket_id: input.ticketId,
    file_id: upload.data.id,
    organization_id: input.workspace.organizationId,
    uploaded_by_user_id: input.workspace.userId,
  });
  if (error) {
    await deleteSupabaseFile(input.workspace, upload.data.id);
    return failed("TICKET_ATTACHMENT_FAILED", "Não foi possível vincular o anexo ao atendimento.");
  }
  await supabase.from("activities").insert({
    id: `act_${crypto.randomUUID()}`,
    organization_id: input.workspace.organizationId,
    actor_user_id: input.workspace.userId,
    type: "ticket.attachment_added",
    title: "Anexo adicionado ao atendimento",
    detail: `${ticket.protocol}: ${input.originalName}`,
    resource_type: "ticket",
    resource_id: input.ticketId,
  });
  return { ok: true, data: { id, fileId: upload.data.id } };
}

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
function fail<T>(code: string, message: string, status: number): MutationResult<T> { return { ok: false, code, message, status }; }
function failed<T>(code = "TICKET_ATTACHMENT_FAILED", message = "Não foi possível adicionar o anexo."): MutationResult<T> { return fail(code, message, 500); }

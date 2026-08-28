import { createHash, randomBytes } from "node:crypto";
import type { MutationResult } from "./mutations";
import { createSupabaseServerClient } from "./server";

type Workspace = {
  userId: string;
  organizationId: string;
  role: string;
};

export type TeamMember = {
  id: string;
  userId: string;
  name: string;
  role: string;
  status: string;
  joinedAt: string;
};

export type TeamInvitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
};

type MemberRpcRow = {
  membership_id: string;
  user_id: string;
  member_name: string;
  member_email: string | null;
  member_role: string;
  member_status: string;
  joined_at: string;
};

type InvitationRpcRow = {
  invitation_id: string;
  invitation_email: string;
  invitation_role: string;
  invitation_status: string;
  invitation_expires_at: string;
  invitation_created_at: string;
};

export async function getTeamData(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const [membersResult, invitationsResult] = await Promise.all([
    supabase.rpc("get_organization_members", { p_organization_id: organizationId }),
    supabase.rpc("get_organization_invitations", { p_organization_id: organizationId }),
  ]);

  if (membersResult.error) throw membersResult.error;
  if (invitationsResult.error) throw invitationsResult.error;

  return {
    members: ((membersResult.data ?? []) as MemberRpcRow[]).map((row) => ({
      id: row.membership_id,
      userId: row.user_id,
      name: row.member_name,
      role: row.member_role,
      status: row.member_status,
      joinedAt: row.joined_at,
    })) as TeamMember[],
    invitations: ((invitationsResult.data ?? []) as InvitationRpcRow[]).map((row) => ({
      id: row.invitation_id,
      email: row.invitation_email,
      role: row.invitation_role,
      status: row.invitation_status,
      expiresAt: row.invitation_expires_at,
      createdAt: row.invitation_created_at,
    })) as TeamInvitation[],
  };
}

export async function createTeamInvitation(
  workspace: Workspace,
  input: { email: string; role: string },
): Promise<MutationResult<{ id: string; token: string; expiresAt: string }>> {
  const supabase = await createSupabaseServerClient();
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.rpc("create_organization_invitation", {
    p_organization_id: workspace.organizationId,
    p_email: input.email,
    p_role: input.role,
    p_token_hash: tokenHash,
    p_expires_at: expiresAt,
  });

  if (error || !data?.[0]) return rpcFailure(error, "INVITATION_CREATE_FAILED", "Não foi possível criar o convite.");
  return { ok: true, data: { id: data[0].invitation_id, token, expiresAt: data[0].invitation_expires_at } };
}

export async function updateTeamMember(
  workspace: Workspace,
  input: { membershipId: string; role: string; status: string },
): Promise<MutationResult<{ updated: true }>> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_organization_member", {
    p_organization_id: workspace.organizationId,
    p_membership_id: input.membershipId,
    p_role: input.role,
    p_status: input.status,
  });
  return error
    ? rpcFailure(error, "MEMBER_UPDATE_FAILED", "Não foi possível atualizar esse acesso.")
    : { ok: true, data: { updated: true } };
}

export async function removeTeamMember(
  workspace: Workspace,
  membershipId: string,
): Promise<MutationResult<{ removed: true }>> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("remove_organization_member", {
    p_organization_id: workspace.organizationId,
    p_membership_id: membershipId,
  });
  return error
    ? rpcFailure(error, "MEMBER_REMOVE_FAILED", "Não foi possível remover esse acesso.")
    : { ok: true, data: { removed: true } };
}

export async function revokeTeamInvitation(
  workspace: Workspace,
  invitationId: string,
): Promise<MutationResult<{ revoked: true }>> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("revoke_organization_invitation", {
    p_organization_id: workspace.organizationId,
    p_invitation_id: invitationId,
  });
  return error
    ? rpcFailure(error, "INVITATION_REVOKE_FAILED", "Não foi possível revogar o convite.")
    : { ok: true, data: { revoked: true } };
}

export async function acceptTeamInvitation(
  token: string,
): Promise<MutationResult<{ organizationId: string; organizationName: string; role: string }>> {
  const supabase = await createSupabaseServerClient();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await supabase.rpc("accept_organization_invitation", { p_token_hash: tokenHash });
  if (error || !data?.[0]) return rpcFailure(error, "INVITATION_ACCEPT_FAILED", "O convite é inválido, expirou ou pertence a outro e-mail.");
  return {
    ok: true,
    data: {
      organizationId: data[0].organization_id,
      organizationName: data[0].organization_name,
      role: data[0].membership_role,
    },
  };
}

function rpcFailure<T>(
  error: { code?: string; message?: string } | null,
  code: string,
  fallback: string,
): MutationResult<T> {
  const status = error?.code === "42501" ? 403 : error?.code === "22023" || error?.code === "23514" ? 422 : 500;
  const safeMessages = [
    "A organização precisa manter ao menos um proprietário ativo.",
    "Convite inválido ou expirado.",
    "Acesso não autorizado.",
  ];
  const message = safeMessages.includes(error?.message ?? "") ? error!.message! : fallback;
  return { ok: false, code, message, status };
}

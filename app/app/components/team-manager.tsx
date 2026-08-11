"use client";

import { Check, Copy, LoaderCircle, ShieldAlert, Trash2, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { roleLabel } from "@/lib/permissions";
import type { TeamInvitation, TeamMember } from "@/lib/supabase/team";

type ApiResult<T = unknown> = { ok: boolean; data?: T; error?: { message?: string } };

export function TeamManager({
  members,
  invitations,
  currentUserId,
  currentRole,
}: {
  members: TeamMember[];
  invitations: TeamInvitation[];
  currentUserId: string;
  currentRole: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy("invite"); setMessage(""); setInviteLink("");
    const response = await fetch("/api/team/invitations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), role: form.get("role") }),
    });
    const result = await response.json() as ApiResult<{ token: string }>;
    setBusy("");
    if (!response.ok || !result.ok || !result.data) return setMessage(result.error?.message ?? "Não foi possível criar o convite.");
    const link = `${window.location.origin}/convite/${result.data.token}`;
    setInviteLink(link);
    setMessage("Convite criado. O link abaixo aparece uma única vez.");
    event.currentTarget.reset();
    router.refresh();
  }

  async function updateMember(id: string, role: string, status: string) {
    setBusy(id); setMessage("");
    const response = await fetch(`/api/team/members/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role, status }),
    });
    const result = await response.json() as ApiResult;
    setBusy("");
    if (!response.ok || !result.ok) return setMessage(result.error?.message ?? "Não foi possível atualizar o membro.");
    setMessage("Acesso atualizado com segurança.");
    router.refresh();
  }

  async function removeMember(id: string) {
    if (!window.confirm("Remover este membro da organização?")) return;
    setBusy(id); setMessage("");
    const response = await fetch(`/api/team/members/${encodeURIComponent(id)}`, { method: "DELETE" });
    const result = await response.json() as ApiResult;
    setBusy("");
    if (!response.ok || !result.ok) return setMessage(result.error?.message ?? "Não foi possível remover o membro.");
    setMessage("Acesso removido.");
    router.refresh();
  }

  async function revokeInvitation(id: string) {
    setBusy(id); setMessage("");
    const response = await fetch(`/api/team/invitations/${encodeURIComponent(id)}`, { method: "DELETE" });
    const result = await response.json() as ApiResult;
    setBusy("");
    if (!response.ok || !result.ok) return setMessage(result.error?.message ?? "Não foi possível revogar o convite.");
    setMessage("Convite revogado.");
    router.refresh();
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="team-layout">
      <section className="dashboard-panel settings-section" aria-labelledby="invite-title">
        <div className="panel-heading"><div><span className="panel-kicker">COLABORAÇÃO PROTEGIDA</span><h2 id="invite-title">Convidar integrante</h2></div><UserPlus aria-hidden="true" /></div>
        <form className="team-invite-form" onSubmit={invite}>
          <div className="form-field"><label htmlFor="team-email">E-mail profissional</label><input id="team-email" name="email" type="email" autoComplete="email" maxLength={254} required /></div>
          <div className="form-field"><label htmlFor="team-role">Papel inicial</label><select id="team-role" name="role" defaultValue="editor"><option value="admin" disabled={currentRole !== "owner"}>Administrador</option><option value="editor">Editor</option><option value="support">Suporte</option><option value="viewer">Leitor</option></select></div>
          <button className="app-primary-button" type="submit" disabled={Boolean(busy)}>{busy === "invite" ? <><LoaderCircle className="spin" aria-hidden="true" />Criando…</> : "Criar convite"}</button>
        </form>
        {inviteLink && <div className="invite-result" role="status"><code>{inviteLink}</code><button type="button" onClick={copyInvite}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? "Copiado" : "Copiar link"}</button></div>}
        {message && <p className="form-message settings-message" role="status">{message}</p>}
      </section>

      <section className="dashboard-panel" aria-labelledby="members-title">
        <div className="panel-heading"><div><span className="panel-kicker">{members.length} ATIVOS OU SUSPENSOS</span><h2 id="members-title">Pessoas e permissões</h2></div></div>
        <div className="member-list">
          {members.map((member) => {
            const protectedMember = member.userId === currentUserId || (currentRole === "admin" && ["owner", "admin"].includes(member.role));
            return <article className="member-row" key={member.id}>
              <div className="member-identity"><span>{member.name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><div><strong>{member.name}{member.userId === currentUserId ? " (você)" : ""}</strong><small>{member.email}</small></div></div>
              <div className="member-controls">
                <select aria-label={`Papel de ${member.name}`} value={member.role} disabled={protectedMember || busy === member.id} onChange={(event) => updateMember(member.id, event.target.value, member.status)}><option value="owner" disabled={currentRole !== "owner"}>Proprietário</option><option value="admin" disabled={currentRole !== "owner"}>Administrador</option><option value="editor">Editor</option><option value="support">Suporte</option><option value="viewer">Leitor</option></select>
                <select aria-label={`Status de ${member.name}`} value={member.status} disabled={protectedMember || busy === member.id} onChange={(event) => updateMember(member.id, member.role, event.target.value)}><option value="active">Ativo</option><option value="suspended">Suspenso</option></select>
                <button className="icon-danger-button" type="button" aria-label={`Remover ${member.name}`} title="Remover acesso" disabled={protectedMember || busy === member.id} onClick={() => removeMember(member.id)}>{busy === member.id ? <LoaderCircle className="spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}</button>
              </div>
            </article>;
          })}
        </div>
      </section>

      <section className="dashboard-panel" aria-labelledby="pending-invites-title">
        <div className="panel-heading"><div><span className="panel-kicker">EXPIRAÇÃO AUTOMÁTICA</span><h2 id="pending-invites-title">Convites recentes</h2></div><ShieldAlert aria-hidden="true" /></div>
        <div className="member-list">
          {invitations.length === 0 ? <p className="empty-copy">Nenhum convite pendente ou aceito.</p> : invitations.map((invitation) => <article className="member-row" key={invitation.id}><div><strong>{invitation.email}</strong><small>{roleLabel(invitation.role)} · {invitation.status === "pending" ? `expira em ${new Intl.DateTimeFormat("pt-BR").format(new Date(invitation.expiresAt))}` : "aceito"}</small></div>{invitation.status === "pending" && <button className="text-danger-button" type="button" disabled={busy === invitation.id} onClick={() => revokeInvitation(invitation.id)}>Revogar</button>}</article>)}
        </div>
      </section>
    </div>
  );
}

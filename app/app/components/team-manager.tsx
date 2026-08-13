"use client";

import { Check, Copy, LoaderCircle, ShieldAlert, Trash2, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getManagementCopy } from "@/lib/app-management-i18n";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";
import type { TeamInvitation, TeamMember } from "@/lib/supabase/team";

type ApiResult<T = unknown> = { ok: boolean; data?: T; error?: { message?: string } };

export function TeamManager({ locale, members, invitations, currentUserId, currentRole }: {
  locale: SiteLocale;
  members: TeamMember[];
  invitations: TeamInvitation[];
  currentUserId: string;
  currentRole: string;
}) {
  const router = useRouter();
  const copy = getManagementCopy(locale).team;
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const safeError = (result: ApiResult, fallback: string) => locale === "pt-BR" ? result.error?.message ?? fallback : fallback;

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy("invite"); setMessage(""); setInviteLink("");
    try {
      const response = await fetch("/api/team/invitations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email"), role: form.get("role") }) });
      const result = await response.json() as ApiResult<{ token: string }>;
      if (!response.ok || !result.ok || !result.data) return setMessage(safeError(result, copy.invitationError));
      setInviteLink(`${window.location.origin}/convite/${result.data.token}`);
      setMessage(copy.inviteCreated);
      formElement.reset();
      router.refresh();
    } catch { setMessage(copy.invitationError); } finally { setBusy(""); }
  }

  async function updateMember(id: string, role: string, status: string) {
    setBusy(id); setMessage("");
    try {
      const response = await fetch(`/api/team/members/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ role, status }) });
      const result = await response.json() as ApiResult;
      if (!response.ok || !result.ok) return setMessage(safeError(result, copy.updateError));
      setMessage(copy.accessUpdated); router.refresh();
    } catch { setMessage(copy.updateError); } finally { setBusy(""); }
  }

  async function removeMember(id: string) {
    if (!window.confirm(copy.removeConfirm)) return;
    setBusy(id); setMessage("");
    try {
      const response = await fetch(`/api/team/members/${encodeURIComponent(id)}`, { method: "DELETE" });
      const result = await response.json() as ApiResult;
      if (!response.ok || !result.ok) return setMessage(safeError(result, copy.removeError));
      setMessage(copy.accessRemoved); router.refresh();
    } catch { setMessage(copy.removeError); } finally { setBusy(""); }
  }

  async function revokeInvitation(id: string) {
    setBusy(id); setMessage("");
    try {
      const response = await fetch(`/api/team/invitations/${encodeURIComponent(id)}`, { method: "DELETE" });
      const result = await response.json() as ApiResult;
      if (!response.ok || !result.ok) return setMessage(safeError(result, copy.revokeError));
      setMessage(copy.revoked); router.refresh();
    } catch { setMessage(copy.revokeError); } finally { setBusy(""); }
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { setMessage(copy.copyLink); }
  }

  const roleName = (role: string) => copy.roles[role as keyof typeof copy.roles] ?? role;

  return <div className="team-layout">
    <section className="dashboard-panel settings-section" aria-labelledby="invite-title">
      <div className="panel-heading"><div><span className="panel-kicker">{copy.protected}</span><h2 id="invite-title">{copy.invite}</h2></div><UserPlus aria-hidden="true" /></div>
      <form className="team-invite-form" onSubmit={invite}>
        <div className="form-field"><label htmlFor="team-email">{copy.email}</label><input id="team-email" name="email" type="email" autoComplete="email" maxLength={254} required /></div>
        <div className="form-field"><label htmlFor="team-role">{copy.initialRole}</label><select id="team-role" name="role" defaultValue="editor"><option value="admin" disabled={currentRole !== "owner"}>{copy.roles.admin}</option><option value="editor">{copy.roles.editor}</option><option value="support">{copy.roles.support}</option><option value="viewer">{copy.roles.viewer}</option></select></div>
        <button className="app-primary-button" type="submit" disabled={Boolean(busy)}>{busy === "invite" ? <><LoaderCircle className="spin" aria-hidden="true" />{copy.creating}</> : copy.createInvite}</button>
      </form>
      {inviteLink && <div className="invite-result" role="status"><code>{inviteLink}</code><button type="button" onClick={copyInvite}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? copy.copied : copy.copyLink}</button></div>}
      {message && <p className="form-message settings-message" role="status">{message}</p>}
    </section>

    <section className="dashboard-panel" aria-labelledby="members-title">
      <div className="panel-heading"><div><span className="panel-kicker">{copy.memberCount(members.length)}</span><h2 id="members-title">{copy.people}</h2></div></div>
      <div className="member-list">{members.map((member) => {
        const protectedMember = member.userId === currentUserId || (currentRole === "admin" && ["owner", "admin"].includes(member.role));
        const initials = member.name.split(" ").slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase(toIntlLocale(locale));
        return <article className="member-row" key={member.id}>
          <div className="member-identity"><span>{initials}</span><div><strong>{member.name}{member.userId === currentUserId ? ` (${copy.you})` : ""}</strong><small>{member.email}</small></div></div>
          <div className="member-controls">
            <select aria-label={copy.memberRole(member.name)} value={member.role} disabled={protectedMember || busy === member.id} onChange={(event) => updateMember(member.id, event.target.value, member.status)}><option value="owner" disabled={currentRole !== "owner"}>{copy.roles.owner}</option><option value="admin" disabled={currentRole !== "owner"}>{copy.roles.admin}</option><option value="editor">{copy.roles.editor}</option><option value="support">{copy.roles.support}</option><option value="viewer">{copy.roles.viewer}</option></select>
            <select aria-label={copy.memberStatus(member.name)} value={member.status} disabled={protectedMember || busy === member.id} onChange={(event) => updateMember(member.id, member.role, event.target.value)}><option value="active">{copy.statuses.active}</option><option value="suspended">{copy.statuses.suspended}</option></select>
            <button className="icon-danger-button" type="button" aria-label={copy.remove(member.name)} title={copy.removeTitle} disabled={protectedMember || busy === member.id} onClick={() => removeMember(member.id)}>{busy === member.id ? <LoaderCircle className="spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}</button>
          </div>
        </article>;
      })}</div>
    </section>

    <section className="dashboard-panel" aria-labelledby="pending-invites-title">
      <div className="panel-heading"><div><span className="panel-kicker">{copy.automaticExpiry}</span><h2 id="pending-invites-title">{copy.recentInvites}</h2></div><ShieldAlert aria-hidden="true" /></div>
      <div className="member-list">{invitations.length === 0 ? <p className="empty-copy">{copy.noInvites}</p> : invitations.map((invitation) => <article className="member-row" key={invitation.id}><div><strong>{invitation.email}</strong><small>{roleName(invitation.role)} · {invitation.status === "pending" ? copy.expires(new Intl.DateTimeFormat(toIntlLocale(locale)).format(new Date(invitation.expiresAt))) : copy.accepted}</small></div>{invitation.status === "pending" && <button className="text-danger-button" type="button" disabled={busy === invitation.id} onClick={() => revokeInvitation(invitation.id)}>{copy.revoke}</button>}</article>)}</div>
    </section>
  </div>;
}

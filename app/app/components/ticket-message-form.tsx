"use client";

import { LoaderCircle, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import type { SiteLocale } from "@/lib/site-locale";

export function TicketMessageForm({ ticketId, disabled, locale = "pt-BR" }: { ticketId: string; disabled: boolean; locale?: SiteLocale }) {
  const copy = getOperationalCopy(locale);
  const labels = copy.support.message;
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || disabled) return;
    const form = event.currentTarget; const data = new FormData(form); setSubmitting(true); setMessage("");
    try { const response = await fetch(`/api/tickets/${ticketId}/messages`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: data.get("message") }) }); const result = await response.json() as { ok: boolean; error?: { message: string } }; if (!response.ok || !result.ok) { setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : labels.error); return; } form.reset(); setMessage(labels.success); router.refresh(); } catch { setMessage(copy.common.connectionError); } finally { setSubmitting(false); }
  }
  return <form className="ticket-reply" onSubmit={submit}><div className="form-field"><label htmlFor="ticket-reply-message">{disabled ? labels.closed : labels.add}</label><textarea id="ticket-reply-message" name="message" required minLength={2} maxLength={3000} rows={4} disabled={disabled} placeholder={disabled ? labels.closedPlaceholder : labels.placeholder} /></div>{message && <p className="form-message" role="status">{message}</p>}<button className="app-primary-button" type="submit" disabled={disabled || submitting}>{submitting ? <><LoaderCircle className="spin" aria-hidden="true" />{labels.sending}</> : <><Send aria-hidden="true" />{labels.send}</>}</button></form>;
}

"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import type { SiteLocale } from "@/lib/site-locale";

export function TicketAttachmentForm({ ticketId, disabled, locale = "pt-BR" }: { ticketId: string; disabled: boolean; locale?: SiteLocale }) {
  const copy = getOperationalCopy(locale);
  const labels = copy.support.attachment;
  const router = useRouter(); const [submitting, setSubmitting] = useState(false); const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (submitting || disabled) return; const form = event.currentTarget; setSubmitting(true); setMessage(""); try { const response = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/attachments`, { method: "POST", body: new FormData(form) }); const result = await response.json() as { ok: boolean; error?: { message: string } }; if (!response.ok || !result.ok) { setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : labels.error); return; } form.reset(); setMessage(labels.success); router.refresh(); } catch { setMessage(copy.common.connectionError); } finally { setSubmitting(false); } }
  return <form className="ticket-attachment-form" onSubmit={submit}><div className="form-field"><label htmlFor={`ticket-attachment-${ticketId}`}>{disabled ? labels.closed : labels.add}</label><input id={`ticket-attachment-${ticketId}`} name="file" type="file" required disabled={disabled} accept=".pdf,.png,.jpg,.jpeg,.txt,.md,.docx" /></div>{message && <p className="form-message" role="status">{message}</p>}<button className="app-secondary-button" type="submit" disabled={disabled || submitting}>{submitting ? <LoaderCircle className="spin" aria-hidden="true" /> : <Paperclip aria-hidden="true" />}{submitting ? labels.attaching : labels.attach}</button></form>;
}

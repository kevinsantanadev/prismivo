"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";

export function TicketAttachmentForm({ ticketId, disabled }: { ticketId: string; disabled: boolean }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || disabled) return;
    const form = event.currentTarget;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/attachments`, { method: "POST", body: new FormData(form) });
      const result = await response.json() as { ok: boolean; error?: { message: string } };
      if (!response.ok || !result.ok) return setMessage(result.error?.message ?? "Não foi possível anexar o arquivo.");
      form.reset();
      setMessage("Anexo protegido adicionado.");
      router.refresh();
    } catch {
      setMessage("A conexão falhou.");
    } finally {
      setSubmitting(false);
    }
  }

  return <form className="ticket-attachment-form" onSubmit={submit}>
    <div className="form-field"><label htmlFor={`ticket-attachment-${ticketId}`}>{disabled ? "Atendimento encerrado" : "Adicionar anexo protegido"}</label><input id={`ticket-attachment-${ticketId}`} name="file" type="file" required disabled={disabled} accept=".pdf,.png,.jpg,.jpeg,.txt,.md,.docx" /></div>
    {message && <p className="form-message" role="status">{message}</p>}
    <button className="app-secondary-button" type="submit" disabled={disabled || submitting}>{submitting ? <LoaderCircle className="spin" aria-hidden="true" /> : <Paperclip aria-hidden="true" />}{submitting ? "Anexando…" : "Anexar arquivo"}</button>
  </form>;
}

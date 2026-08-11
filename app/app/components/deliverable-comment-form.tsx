"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, MessageSquarePlus } from "lucide-react";
import { useRouter } from "next/navigation";

export function DeliverableCommentForm({ deliverableId }: { deliverableId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/deliverables/${encodeURIComponent(deliverableId)}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: data.get("body") }),
      });
      const result = await response.json() as { ok: boolean; error?: { message: string } };
      if (!response.ok || !result.ok) return setMessage(result.error?.message ?? "Não foi possível comentar.");
      form.reset();
      router.refresh();
    } catch {
      setMessage("A conexão falhou.");
    } finally {
      setSubmitting(false);
    }
  }

  return <form className="deliverable-comment-form" onSubmit={submit}>
    <label className="sr-only" htmlFor={`deliverable-comment-${deliverableId}`}>Adicionar comentário</label>
    <textarea id={`deliverable-comment-${deliverableId}`} name="body" required minLength={2} maxLength={3000} rows={2} placeholder="Registre um comentário ou orientação…" />
    {message && <p className="form-message error" role="alert">{message}</p>}
    <button type="submit" disabled={submitting} aria-label="Publicar comentário">{submitting ? <LoaderCircle className="spin" aria-hidden="true" /> : <MessageSquarePlus aria-hidden="true" />}<span>Comentar</span></button>
  </form>;
}

"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, MessageSquarePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import type { SiteLocale } from "@/lib/site-locale";

export function DeliverableCommentForm({ deliverableId, locale = "pt-BR" }: { deliverableId: string; locale?: SiteLocale }) {
  const router = useRouter();
  const copy = getOperationalCopy(locale);
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
      if (!response.ok || !result.ok) return setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : copy.deliverables.comment.error);
      form.reset();
      router.refresh();
    } catch {
      setMessage(copy.notifications.connectionError);
    } finally {
      setSubmitting(false);
    }
  }

  return <form className="deliverable-comment-form" onSubmit={submit}>
    <label className="sr-only" htmlFor={`deliverable-comment-${deliverableId}`}>{copy.deliverables.comment.label}</label>
    <textarea id={`deliverable-comment-${deliverableId}`} name="body" required minLength={2} maxLength={3000} rows={2} placeholder={copy.deliverables.comment.placeholder} />
    {message && <p className="form-message error" role="alert">{message}</p>}
    <button type="submit" disabled={submitting} aria-label={copy.deliverables.comment.publish}>{submitting ? <LoaderCircle className="spin" aria-hidden="true" /> : <MessageSquarePlus aria-hidden="true" />}<span>{copy.deliverables.comment.submit}</span></button>
  </form>;
}

"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import type { SiteLocale } from "@/lib/site-locale";

export function DeliverableVersionForm({ deliverableId, locale = "pt-BR" }: { deliverableId: string; locale?: SiteLocale }) {
  const router = useRouter();
  const copy = getOperationalCopy(locale);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/deliverables/${encodeURIComponent(deliverableId)}/versions`, { method: "POST", body: new FormData(form) });
      const result = await response.json() as { ok: boolean; error?: { message: string } };
      if (!response.ok || !result.ok) return setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : copy.deliverables.version.error);
      form.reset();
      setMessage(copy.deliverables.version.success);
      router.refresh();
    } catch {
      setMessage(copy.notifications.connectionError);
    } finally {
      setSubmitting(false);
    }
  }

  return <form className="deliverable-version-form" onSubmit={submit}>
    <div className="form-field"><label htmlFor={`version-file-${deliverableId}`}>{copy.deliverables.version.file}</label><input id={`version-file-${deliverableId}`} name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.txt,.md,.docx" /></div>
    <div className="form-field"><label htmlFor={`version-summary-${deliverableId}`}>{copy.deliverables.version.summary} <span>({copy.common.optional})</span></label><input id={`version-summary-${deliverableId}`} name="summary" maxLength={1000} placeholder={copy.deliverables.version.placeholder} /></div>
    <label className="inline-check"><input type="checkbox" name="requestApproval" value="true" />{copy.deliverables.version.approval}</label>
    {message && <p className="form-message" role="status">{message}</p>}
    <button className="app-primary-button" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" aria-hidden="true" />{copy.deliverables.version.submitting}</> : <><UploadCloud aria-hidden="true" />{copy.deliverables.version.submit}</>}</button>
  </form>;
}

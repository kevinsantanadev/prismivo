"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, PackagePlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import type { SiteLocale } from "@/lib/site-locale";

export function DeliverableForm({ projectId, locale = "pt-BR" }: { projectId: string; locale?: SiteLocale }) {
  const router = useRouter();
  const copy = getOperationalCopy(locale);
  const [open, setOpen] = useState(false);
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
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/deliverables`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: data.get("title"), description: data.get("description") }),
      });
      const result = await response.json() as { ok: boolean; error?: { message: string } };
      if (!response.ok || !result.ok) return setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : copy.deliverables.create.error);
      form.reset();
      setOpen(false);
      router.refresh();
    } catch {
      setMessage(copy.notifications.connectionError);
    } finally {
      setSubmitting(false);
    }
  }

  return <>
    <button className="app-secondary-button" type="button" onClick={() => setOpen(true)}><PackagePlus aria-hidden="true" />{copy.deliverables.create.button}</button>
    {open && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
      <form className="app-dialog" onSubmit={submit} aria-labelledby="deliverable-form-title">
        <div className="project-form-heading"><div><span className="panel-kicker">{copy.deliverables.create.delivery}</span><h2 id="deliverable-form-title">{copy.deliverables.create.title}</h2></div><button type="button" onClick={() => setOpen(false)} aria-label={copy.deliverables.create.close}><X aria-hidden="true" /></button></div>
        <div className="form-field"><label htmlFor="deliverable-title">{copy.deliverables.create.name}</label><input id="deliverable-title" name="title" required minLength={3} maxLength={140} /></div>
        <div className="form-field"><label htmlFor="deliverable-description">{copy.deliverables.create.context} <span>({copy.common.optional})</span></label><textarea id="deliverable-description" name="description" rows={4} maxLength={1200} /></div>
        {message && <p className="form-message error" role="alert">{message}</p>}
        <button className="app-primary-button" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" aria-hidden="true" />{copy.deliverables.create.submitting}</> : copy.deliverables.create.submit}</button>
      </form>
    </div>}
  </>;
}

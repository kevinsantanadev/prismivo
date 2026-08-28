"use client";

import { CheckCircle2, LoaderCircle, Plus } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import type { SiteLocale } from "@/lib/site-locale";

export function ProjectForm({ locale = "pt-BR", activeProjects = 0, projectLimit = null }: { locale?: SiteLocale; activeProjects?: number; projectLimit?: number | null }) {
  const router = useRouter();
  const copy = getOperationalCopy(locale);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const limitReached = projectLimit !== null && activeProjects >= projectLimit;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          clientName: data.get("clientName"),
          description: data.get("description"),
          dueDate: data.get("dueDate"),
        }),
      });
      const result = await response.json() as { ok: boolean; error?: { message: string } };
      if (!response.ok || !result.ok) {
        setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : copy.projectForm.createError);
        return;
      }
      form.reset();
      setSuccess(true);
      setMessage(copy.projectForm.success);
      router.refresh();
    } catch {
      setMessage(copy.common.connectionError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="quick-project" id="novo-projeto">
      <button className="app-primary-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="project-form-panel" aria-describedby={projectLimit !== null ? "project-quota-status" : undefined} disabled={limitReached}><Plus aria-hidden="true" />{copy.projectForm.newProject}</button>
      {projectLimit !== null && <div className={`project-quota ${limitReached ? "is-reached" : ""}`} id="project-quota-status"><span>{copy.projectForm.quota(activeProjects, projectLimit)}</span>{limitReached && <><strong>{copy.projectForm.quotaReached}</strong><Link href="/app/projetos">{copy.projectForm.manageQuota}</Link></>}</div>}
      {open && <form id="project-form-panel" onSubmit={submit} className="project-form">
        <div className="project-form-heading"><div><span className="eyebrow">{copy.projectForm.quickAction}</span><h2>{copy.projectForm.createProject}</h2></div><button type="button" onClick={() => setOpen(false)} aria-label={copy.projectForm.close}>×</button></div>
        <div className="form-row"><div className="form-field"><label htmlFor="project-name">{copy.projectForm.projectName}</label><input id="project-name" name="name" required minLength={2} maxLength={90} /></div><div className="form-field"><label htmlFor="client-name">{copy.projectForm.client}</label><input id="client-name" name="clientName" required minLength={2} maxLength={90} /></div></div>
        <div className="form-field"><label htmlFor="project-description">{copy.projectForm.description}</label><textarea id="project-description" name="description" maxLength={500} rows={3} /></div>
        <div className="form-field compact-field"><label htmlFor="due-date">{copy.projectForm.deadline}</label><input id="due-date" name="dueDate" type="date" /></div>
        {message && <div className={`form-message ${success ? "success" : ""}`} role="status">{success && <CheckCircle2 aria-hidden="true" />}{message}</div>}
        <button className="button" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" aria-hidden="true" />{copy.common.saving}</> : copy.projectForm.createProject}</button>
      </form>}
    </div>
  );
}

"use client";

import { CheckCircle2, LoaderCircle, Plus, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import type { SiteLocale } from "@/lib/site-locale";

type ProjectOption = { id: string; name: string; clientName: string | null };

export function ApprovalForm({ projects, locale = "pt-BR" }: { projects: ProjectOption[]; locale?: SiteLocale }) {
  const router = useRouter();
  const copy = getOperationalCopy(locale);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    setMessage("");
    setSuccess(false);
    try {
      const response = await fetch("/api/approvals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId: data.get("projectId"),
          title: data.get("title"),
          description: data.get("description"),
          dueDate: data.get("dueDate"),
        }),
      });
      const result = await response.json() as { ok: boolean; error?: { message: string } };
      if (!response.ok || !result.ok) {
        setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : copy.approvals.form.error);
        return;
      }
      form.reset();
      setSuccess(true);
      setMessage(copy.approvals.form.success);
      router.refresh();
    } catch {
      setMessage(copy.common.connectionError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="quick-project">
      <button className="app-primary-button" type="button" onClick={() => setOpen(true)} disabled={projects.length === 0} title={projects.length === 0 ? copy.approvals.form.firstProject : undefined}>
        <Plus aria-hidden="true" />{copy.approvals.form.newApproval}
      </button>
      {open && (
        <div className="app-dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <form className="app-dialog" onSubmit={submit} aria-labelledby="approval-form-title">
            <div className="project-form-heading"><div><span className="panel-kicker">{copy.approvals.form.decision}</span><h2 id="approval-form-title">{copy.approvals.form.request}</h2></div><button type="button" onClick={() => setOpen(false)} aria-label={copy.approvals.form.close}><X aria-hidden="true" /></button></div>
            <div className="form-field"><label htmlFor="approval-project">{copy.approvals.form.project}</label><select id="approval-project" name="projectId" required defaultValue=""><option value="" disabled>{copy.approvals.form.selectProject}</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}{project.clientName ? ` · ${project.clientName}` : ""}</option>)}</select></div>
            <div className="form-field"><label htmlFor="approval-title">{copy.approvals.form.item}</label><input id="approval-title" name="title" required minLength={3} maxLength={120} /></div>
            <div className="form-field"><label htmlFor="approval-description">{copy.approvals.form.context} <span>({copy.common.optional})</span></label><textarea id="approval-description" name="description" rows={4} maxLength={700} /></div>
            <div className="form-field compact-field"><label htmlFor="approval-due-date">{copy.approvals.form.deadline} <span>({copy.common.optional})</span></label><input id="approval-due-date" name="dueDate" type="date" /></div>
            {message && <div className={`form-message ${success ? "success" : ""}`} role="status">{success && <CheckCircle2 aria-hidden="true" />}{message}</div>}
            <div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => setOpen(false)}>{copy.common.cancel}</button><button className="app-primary-button" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" aria-hidden="true" />{copy.common.saving}</> : copy.approvals.form.create}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

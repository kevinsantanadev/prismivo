"use client";

import { CheckCircle2, LoaderCircle, Upload, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import type { SiteLocale } from "@/lib/site-locale";

type ProjectOption = { id: string; name: string };

export function FileUpload({ projects, fixedProjectId, locale = "pt-BR" }: { projects: ProjectOption[]; fixedProjectId?: string; locale?: SiteLocale }) {
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
    if (fixedProjectId) data.set("projectId", fixedProjectId);
    setSubmitting(true);
    setMessage(copy.files.upload.validating);
    setSuccess(false);
    try {
      const response = await fetch("/api/files", { method: "POST", body: data });
      const result = await response.json() as { ok: boolean; error?: { message: string } };
      if (!response.ok || !result.ok) {
        setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : copy.files.upload.error);
        return;
      }
      form.reset();
      setSuccess(true);
      setMessage(copy.files.upload.success);
      router.refresh();
    } catch {
      setMessage(copy.common.connectionError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="quick-project">
      <button className="app-primary-button" type="button" onClick={() => setOpen(true)}><Upload aria-hidden="true" />{copy.files.upload.send}</button>
      {open && <div className="app-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <form className="app-dialog" onSubmit={submit} aria-labelledby="file-upload-title">
          <div className="project-form-heading"><div><span className="panel-kicker">{copy.files.upload.privateStorage}</span><h2 id="file-upload-title">{copy.files.upload.send}</h2></div><button type="button" onClick={() => setOpen(false)} aria-label={copy.files.upload.close}><X aria-hidden="true" /></button></div>
          {!fixedProjectId && <div className="form-field"><label htmlFor="file-project">{copy.files.upload.project} <span>({copy.common.optional})</span></label><select id="file-project" name="projectId" defaultValue=""><option value="">{copy.files.upload.general}</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>}
          <label className="upload-dropzone" htmlFor="private-file"><Upload aria-hidden="true" /><strong>{copy.files.upload.choose}</strong><span>{copy.files.upload.formats}</span><input id="private-file" name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.txt,.md,.docx" /></label>
          {submitting && <div className="upload-progress" role="progressbar" aria-label={copy.files.upload.progress}><span /></div>}
          {message && <div className={`form-message ${success ? "success" : ""}`} role="status">{success && <CheckCircle2 aria-hidden="true" />}{message}</div>}
          <div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => setOpen(false)}>{copy.files.upload.cancel}</button><button className="app-primary-button" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" aria-hidden="true" />{copy.files.upload.sending}</> : copy.files.upload.saving}</button></div>
        </form>
      </div>}
    </div>
  );
}

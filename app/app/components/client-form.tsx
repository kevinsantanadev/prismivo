"use client";

import { CheckCircle2, LoaderCircle, Plus, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import type { SiteLocale } from "@/lib/site-locale";

export function ClientForm({ locale = "pt-BR" }: { locale?: SiteLocale }) {
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
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          company: data.get("company"),
        }),
      });
      const result = await response.json() as { ok: boolean; error?: { message: string } };
      if (!response.ok || !result.ok) {
        setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : copy.clients.form.error);
        return;
      }
      form.reset();
      setSuccess(true);
      setMessage(copy.clients.form.success);
      router.refresh();
    } catch {
      setMessage(copy.common.connectionError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="quick-project">
      <button className="app-primary-button" type="button" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />{copy.clients.form.newClient}
      </button>
      {open && (
        <div className="app-dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <form className="app-dialog" onSubmit={submit} aria-labelledby="client-form-title">
            <div className="project-form-heading">
              <div><span className="panel-kicker">{copy.clients.form.portfolio}</span><h2 id="client-form-title">{copy.clients.form.addClient}</h2></div>
              <button type="button" onClick={() => setOpen(false)} aria-label={copy.clients.form.close}><X aria-hidden="true" /></button>
            </div>
            <div className="form-field"><label htmlFor="client-name">{copy.clients.form.name}</label><input id="client-name" name="name" required minLength={2} maxLength={90} autoFocus /></div>
            <div className="form-field"><label htmlFor="client-company">{copy.clients.form.company} <span>({copy.common.optional})</span></label><input id="client-company" name="company" maxLength={120} /></div>
            <div className="form-field"><label htmlFor="client-email">{copy.clients.form.email} <span>({copy.common.optional})</span></label><input id="client-email" name="email" type="email" maxLength={160} autoComplete="email" /></div>
            {message && <div className={`form-message ${success ? "success" : ""}`} role="status">{success && <CheckCircle2 aria-hidden="true" />}{message}</div>}
            <div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => setOpen(false)}>{copy.common.cancel}</button><button className="app-primary-button" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" aria-hidden="true" />{copy.common.saving}</> : copy.clients.form.addClient}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

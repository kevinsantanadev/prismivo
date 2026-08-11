"use client";

import { CheckCircle2, LoaderCircle, Plus, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import type { SiteLocale } from "@/lib/site-locale";

type ClientOption = { id: string; name: string; company: string | null };

export function TicketForm({ clients, locale = "pt-BR" }: { clients: ClientOption[]; locale?: SiteLocale }) {
  const copy = getOperationalCopy(locale);
  const labels = copy.support;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setSubmitting(true); setMessage(""); setSuccess(false);
    try {
      const response = await fetch("/api/tickets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ clientId: data.get("clientId") || undefined, category: data.get("category"), priority: data.get("priority"), subject: data.get("subject"), message: data.get("message") }) });
      const result = await response.json() as { ok: boolean; data?: { id: string }; error?: { message: string } };
      if (!response.ok || !result.ok) { setMessage(locale === "pt-BR" && result.error?.message ? result.error.message : labels.form.error); return; }
      form.reset(); setSuccess(true); setMessage(labels.form.success); router.refresh();
      if (result.data?.id) router.push(`/app/atendimento/${result.data.id}`);
    } catch { setMessage(copy.common.connectionError); } finally { setSubmitting(false); }
  }

  return <div className="quick-project"><button className="app-primary-button" type="button" onClick={() => setOpen(true)}><Plus aria-hidden="true" />{labels.form.newTicket}</button>{open && <div className="app-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><form className="app-dialog" onSubmit={submit} aria-labelledby="ticket-form-title"><div className="project-form-heading"><div><span className="panel-kicker">{labels.form.center}</span><h2 id="ticket-form-title">{labels.form.open}</h2></div><button type="button" onClick={() => setOpen(false)} aria-label={labels.form.close}><X aria-hidden="true" /></button></div><div className="form-field"><label htmlFor="ticket-client">{labels.form.client} <span>({copy.common.optional})</span></label><select id="ticket-client" name="clientId" defaultValue=""><option value="">{labels.form.internal}</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.company ? ` · ${client.company}` : ""}</option>)}</select></div><div className="form-row"><div className="form-field"><label htmlFor="ticket-category">{labels.form.category}</label><select id="ticket-category" name="category" defaultValue="technical">{Object.entries(labels.categories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="form-field"><label htmlFor="ticket-priority">{labels.form.priority}</label><select id="ticket-priority" name="priority" defaultValue="normal">{Object.entries(labels.priorities).reverse().map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div><div className="form-field"><label htmlFor="ticket-subject">{labels.form.subject}</label><input id="ticket-subject" name="subject" required minLength={4} maxLength={140} /></div><div className="form-field"><label htmlFor="ticket-message">{labels.form.message}</label><textarea id="ticket-message" name="message" required minLength={10} maxLength={3000} rows={5} /></div>{message && <div className={`form-message ${success ? "success" : ""}`} role="status">{success && <CheckCircle2 aria-hidden="true" />}{message}</div>}<div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => setOpen(false)}>{copy.common.cancel}</button><button className="app-primary-button" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" aria-hidden="true" />{labels.form.opening}</> : labels.form.protocol}</button></div></form></div>}</div>;
}

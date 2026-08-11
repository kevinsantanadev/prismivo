"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";

export function DeliverableVersionForm({ deliverableId }: { deliverableId: string }) {
  const router = useRouter();
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
      if (!response.ok || !result.ok) return setMessage(result.error?.message ?? "Não foi possível criar a versão.");
      form.reset();
      setMessage("Nova versão registrada.");
      router.refresh();
    } catch {
      setMessage("A conexão falhou.");
    } finally {
      setSubmitting(false);
    }
  }

  return <form className="deliverable-version-form" onSubmit={submit}>
    <div className="form-field"><label htmlFor={`version-file-${deliverableId}`}>Arquivo da nova versão</label><input id={`version-file-${deliverableId}`} name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.txt,.md,.docx" /></div>
    <div className="form-field"><label htmlFor={`version-summary-${deliverableId}`}>Resumo das mudanças <span>(opcional)</span></label><input id={`version-summary-${deliverableId}`} name="summary" maxLength={1000} placeholder="O que mudou nesta versão?" /></div>
    <label className="inline-check"><input type="checkbox" name="requestApproval" value="true" />Solicitar aprovação ao publicar</label>
    {message && <p className="form-message" role="status">{message}</p>}
    <button className="app-primary-button" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" aria-hidden="true" />Enviando…</> : <><UploadCloud aria-hidden="true" />Criar versão</>}</button>
  </form>;
}

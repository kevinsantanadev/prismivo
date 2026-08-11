"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, PackagePlus, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function DeliverableForm({ projectId }: { projectId: string }) {
  const router = useRouter();
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
      if (!response.ok || !result.ok) return setMessage(result.error?.message ?? "Não foi possível criar o entregável.");
      form.reset();
      setOpen(false);
      router.refresh();
    } catch {
      setMessage("A conexão falhou.");
    } finally {
      setSubmitting(false);
    }
  }

  return <>
    <button className="app-secondary-button" type="button" onClick={() => setOpen(true)}><PackagePlus aria-hidden="true" />Novo entregável</button>
    {open && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
      <form className="app-dialog" onSubmit={submit} aria-labelledby="deliverable-form-title">
        <div className="project-form-heading"><div><span className="panel-kicker">ENTREGA</span><h2 id="deliverable-form-title">Criar entregável</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Fechar formulário"><X aria-hidden="true" /></button></div>
        <div className="form-field"><label htmlFor="deliverable-title">Nome</label><input id="deliverable-title" name="title" required minLength={3} maxLength={140} /></div>
        <div className="form-field"><label htmlFor="deliverable-description">Contexto <span>(opcional)</span></label><textarea id="deliverable-description" name="description" rows={4} maxLength={1200} /></div>
        {message && <p className="form-message error" role="alert">{message}</p>}
        <button className="app-primary-button" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" aria-hidden="true" />Criando…</> : "Criar entregável"}</button>
      </form>
    </div>}
  </>;
}

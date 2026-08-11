"use client";

import { CheckCircle2, LoaderCircle, Plus, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ClientForm() {
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
        setMessage(result.error?.message ?? "Não foi possível adicionar o cliente.");
        return;
      }
      form.reset();
      setSuccess(true);
      setMessage("Cliente adicionado à carteira.");
      router.refresh();
    } catch {
      setMessage("A conexão falhou. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="quick-project">
      <button className="app-primary-button" type="button" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />Novo cliente
      </button>
      {open && (
        <div className="app-dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <form className="app-dialog" onSubmit={submit} aria-labelledby="client-form-title">
            <div className="project-form-heading">
              <div><span className="panel-kicker">CARTEIRA</span><h2 id="client-form-title">Adicionar cliente</h2></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar formulário"><X aria-hidden="true" /></button>
            </div>
            <div className="form-field"><label htmlFor="client-name">Nome</label><input id="client-name" name="name" required minLength={2} maxLength={90} autoFocus /></div>
            <div className="form-field"><label htmlFor="client-company">Empresa <span>(opcional)</span></label><input id="client-company" name="company" maxLength={120} /></div>
            <div className="form-field"><label htmlFor="client-email">E-mail <span>(opcional)</span></label><input id="client-email" name="email" type="email" maxLength={160} autoComplete="email" /></div>
            {message && <div className={`form-message ${success ? "success" : ""}`} role="status">{success && <CheckCircle2 aria-hidden="true" />}{message}</div>}
            <div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => setOpen(false)}>Cancelar</button><button className="app-primary-button" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" aria-hidden="true" />Salvando…</> : "Adicionar cliente"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

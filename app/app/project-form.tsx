"use client";

import { CheckCircle2, LoaderCircle, Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ProjectForm() {
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
        setMessage(result.error?.message ?? "Não foi possível criar o projeto.");
        return;
      }
      form.reset();
      setSuccess(true);
      setMessage("Projeto criado e registrado no histórico.");
      router.refresh();
    } catch {
      setMessage("A conexão falhou. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="quick-project" id="novo-projeto">
      <button className="app-primary-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="project-form-panel"><Plus aria-hidden="true" />Novo projeto</button>
      {open && <form id="project-form-panel" onSubmit={submit} className="project-form">
        <div className="project-form-heading"><div><span className="eyebrow">AÇÃO RÁPIDA</span><h2>Criar projeto</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Fechar formulário">×</button></div>
        <div className="form-row"><div className="form-field"><label htmlFor="project-name">Nome do projeto</label><input id="project-name" name="name" required minLength={2} maxLength={90} /></div><div className="form-field"><label htmlFor="client-name">Cliente</label><input id="client-name" name="clientName" required minLength={2} maxLength={90} /></div></div>
        <div className="form-field"><label htmlFor="project-description">Descrição</label><textarea id="project-description" name="description" maxLength={500} rows={3} /></div>
        <div className="form-field compact-field"><label htmlFor="due-date">Prazo opcional</label><input id="due-date" name="dueDate" type="date" /></div>
        {message && <div className={`form-message ${success ? "success" : ""}`} role="status">{success && <CheckCircle2 aria-hidden="true" />}{message}</div>}
        <button className="button" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" aria-hidden="true" />Salvando…</> : "Criar projeto"}</button>
      </form>}
    </div>
  );
}


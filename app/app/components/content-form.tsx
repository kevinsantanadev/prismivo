"use client";

import { CheckCircle2, FilePlus2, LoaderCircle, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ContentForm() {
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
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: data.get("kind"),
          slug: data.get("slug"),
          title: data.get("title"),
          excerpt: data.get("excerpt"),
          body: data.get("body"),
          tags: String(data.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean),
          status: data.get("status"),
        }),
      });
      const result = await response.json() as { ok: boolean; error?: { message: string } };
      if (!response.ok || !result.ok) {
        setMessage(result.error?.message ?? "Não foi possível criar o conteúdo.");
        return;
      }
      form.reset();
      setSuccess(true);
      setMessage("Conteúdo registrado no estúdio.");
      router.refresh();
    } catch {
      setMessage("A conexão falhou. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="quick-project">
    <button className="app-primary-button" type="button" onClick={() => setOpen(true)}><FilePlus2 aria-hidden="true" />Novo conteúdo</button>
    {open && <div className="app-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <form className="app-dialog content-dialog" onSubmit={submit} aria-labelledby="content-form-title">
        <div className="project-form-heading"><div><span className="panel-kicker">ESTÚDIO</span><h2 id="content-form-title">Criar conteúdo</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Fechar formulário"><X aria-hidden="true" /></button></div>
        <div className="content-form-grid">
          <div className="form-field"><label htmlFor="content-kind">Formato</label><select id="content-kind" name="kind" defaultValue="article"><option value="article">Artigo</option><option value="case_study">Caso</option><option value="service">Serviço</option><option value="help">Ajuda</option></select></div>
          <div className="form-field"><label htmlFor="content-status">Estado inicial</label><select id="content-status" name="status" defaultValue="draft"><option value="draft">Rascunho</option><option value="published">Publicado</option></select></div>
        </div>
        <div className="form-field"><label htmlFor="content-title">Título</label><input id="content-title" name="title" minLength={4} maxLength={160} required autoFocus /></div>
        <div className="form-field"><label htmlFor="content-slug">Endereço</label><input id="content-slug" name="slug" minLength={3} maxLength={100} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="guia-de-operacoes" required /><small>Somente letras minúsculas, números e hífens.</small></div>
        <div className="form-field"><label htmlFor="content-excerpt">Resumo</label><textarea id="content-excerpt" name="excerpt" minLength={20} maxLength={320} rows={3} required /></div>
        <div className="form-field"><label htmlFor="content-body">Conteúdo</label><textarea id="content-body" name="body" minLength={80} maxLength={30000} rows={9} required /></div>
        <div className="form-field"><label htmlFor="content-tags">Tags <span>(separadas por vírgula)</span></label><input id="content-tags" name="tags" maxLength={260} placeholder="operações, clientes, segurança" /></div>
        {message && <div className={`form-message ${success ? "success" : ""}`} role="status">{success && <CheckCircle2 aria-hidden="true" />}{message}</div>}
        <div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => setOpen(false)}>Cancelar</button><button className="app-primary-button" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" aria-hidden="true" />Salvando…</> : "Salvar conteúdo"}</button></div>
      </form>
    </div>}
  </div>;
}

import { Download, History, MessageCircle, PackageCheck } from "lucide-react";
import type { DeliverableRecord } from "@/lib/supabase/deliverables";
import { DeliverableCommentForm } from "./deliverable-comment-form";
import { DeliverableForm } from "./deliverable-form";
import { DeliverableVersionForm } from "./deliverable-version-form";

export function ProjectDeliverables({
  projectId,
  items,
  canWrite,
  canComment,
}: {
  projectId: string;
  items: DeliverableRecord[];
  canWrite: boolean;
  canComment: boolean;
}) {
  return <section className="dashboard-panel detail-section project-deliverables" aria-labelledby="deliverables-title">
    <div className="detail-section-heading"><div><span className="panel-kicker">VERSÕES E DECISÕES</span><h2 id="deliverables-title">Entregáveis</h2></div>{canWrite && <DeliverableForm projectId={projectId} />}</div>
    {items.length === 0 ? <div className="empty-state compact"><PackageCheck aria-hidden="true" /><h3>Nenhum entregável</h3><p>Crie o primeiro item para organizar arquivos, versões, comentários e aprovação.</p></div> : <div className="deliverable-stack">
      {items.map((item, index) => <article className="deliverable-card" key={item.id}>
        <header><div><span className={`deliverable-status ${item.status}`}>{statusLabel(item.status)}</span><h3>{item.title}</h3><p>{item.description || "Sem contexto adicional."}</p></div><strong>v{item.currentVersionNumber || "—"}</strong></header>
        <div className="deliverable-meta"><span>Criado por {item.creatorName}</span><span>{formatDate(item.createdAt)}</span></div>
        <details open={index === 0}>
          <summary><History aria-hidden="true" />Histórico de versões <span>{item.versions.length}</span></summary>
          <div className="deliverable-versions">
            {item.versions.length === 0 ? <p className="empty-copy">Envie a primeira versão para iniciar o histórico.</p> : item.versions.map((version) => <article key={version.id}>
              <span className="version-index">v{version.versionNumber}</span>
              <div><strong>{version.originalName}</strong><p>{version.summary || "Versão registrada sem resumo de alterações."}</p><small>{version.creatorName} · {formatDate(version.createdAt)} · {formatBytes(version.sizeBytes)}</small></div>
              <a href={`/api/files/${encodeURIComponent(version.fileId)}/download`}><Download aria-hidden="true" />Baixar</a>
            </article>)}
          </div>
          {canWrite && <DeliverableVersionForm deliverableId={item.id} />}
        </details>
        <section className="deliverable-comments" aria-label={`Comentários de ${item.title}`}>
          <div className="deliverable-comments-heading"><MessageCircle aria-hidden="true" /><strong>Comentários</strong><span>{item.comments.length}</span></div>
          {item.comments.length > 0 && <div className="deliverable-comment-list">{item.comments.map((comment) => <article key={comment.id}><span aria-hidden="true">{initials(comment.authorName)}</span><div><strong>{comment.authorName}</strong><p>{comment.body}</p><time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time></div></article>)}</div>}
          {canComment && <DeliverableCommentForm deliverableId={item.id} />}
        </section>
      </article>)}
    </div>}
  </section>;
}

function statusLabel(status: DeliverableRecord["status"]) {
  const labels = { draft: "Rascunho", in_review: "Em revisão", approved: "Aprovado", changes_requested: "Ajustes", archived: "Arquivado" };
  return labels[status];
}
function formatDate(value: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function formatBytes(value: number) { return value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`; }
function initials(value: string) { return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("pt-BR"); }

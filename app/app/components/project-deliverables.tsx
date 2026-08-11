import { Download, History, MessageCircle, PackageCheck } from "lucide-react";
import type { DeliverableRecord } from "@/lib/supabase/deliverables";
import { DeliverableCommentForm } from "./deliverable-comment-form";
import { DeliverableForm } from "./deliverable-form";
import { DeliverableVersionForm } from "./deliverable-version-form";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";

export function ProjectDeliverables({
  projectId,
  items,
  canWrite,
  canComment,
  locale = "pt-BR",
}: {
  projectId: string;
  items: DeliverableRecord[];
  canWrite: boolean;
  canComment: boolean;
  locale?: SiteLocale;
}) {
  const copy = getOperationalCopy(locale);
  return <section className="dashboard-panel detail-section project-deliverables" aria-labelledby="deliverables-title">
    <div className="detail-section-heading"><div><span className="panel-kicker">{copy.deliverables.versions}</span><h2 id="deliverables-title">{copy.deliverables.title}</h2></div>{canWrite && <DeliverableForm projectId={projectId} locale={locale} />}</div>
    {items.length === 0 ? <div className="empty-state compact"><PackageCheck aria-hidden="true" /><h3>{copy.deliverables.empty}</h3><p>{copy.deliverables.emptyDetail}</p></div> : <div className="deliverable-stack">
      {items.map((item, index) => <article className="deliverable-card" key={item.id}>
        <header><div><span className={`deliverable-status ${item.status}`}>{statusLabel(item.status, locale)}</span><h3>{item.title}</h3><p>{item.description || copy.deliverables.noContext}</p></div><strong>v{item.currentVersionNumber || "—"}</strong></header>
        <div className="deliverable-meta"><span>{copy.deliverables.createdBy(item.creatorName)}</span><span>{formatDate(item.createdAt, locale)}</span></div>
        <details open={index === 0}>
          <summary><History aria-hidden="true" />{copy.deliverables.history} <span>{item.versions.length}</span></summary>
          <div className="deliverable-versions">
            {item.versions.length === 0 ? <p className="empty-copy">{copy.deliverables.firstVersion}</p> : item.versions.map((version) => <article key={version.id}>
              <span className="version-index">v{version.versionNumber}</span>
              <div><strong>{version.originalName}</strong><p>{version.summary || copy.deliverables.noSummary}</p><small>{version.creatorName} · {formatDate(version.createdAt, locale)} · {formatBytes(version.sizeBytes, locale)}</small></div>
              <a href={`/api/files/${encodeURIComponent(version.fileId)}/download`}><Download aria-hidden="true" />{copy.deliverables.download}</a>
            </article>)}
          </div>
          {canWrite && <DeliverableVersionForm deliverableId={item.id} locale={locale} />}
        </details>
        <section className="deliverable-comments" aria-label={copy.deliverables.comments(item.title)}>
          <div className="deliverable-comments-heading"><MessageCircle aria-hidden="true" /><strong>{copy.deliverables.commentsTitle}</strong><span>{item.comments.length}</span></div>
          {item.comments.length > 0 && <div className="deliverable-comment-list">{item.comments.map((comment) => <article key={comment.id}><span aria-hidden="true">{initials(comment.authorName, locale)}</span><div><strong>{comment.authorName}</strong><p>{comment.body}</p><time dateTime={comment.createdAt}>{formatDate(comment.createdAt, locale)}</time></div></article>)}</div>}
          {canComment && <DeliverableCommentForm deliverableId={item.id} locale={locale} />}
        </section>
      </article>)}
    </div>}
  </section>;
}

function statusLabel(status: DeliverableRecord["status"], locale: SiteLocale) {
  const labels = getOperationalCopy(locale).deliverables.statuses;
  return status === "draft" ? labels.draft : status === "in_review" ? labels.review : status === "approved" ? labels.approved : status === "changes_requested" ? labels.changes : labels.archived;
}
function formatDate(value: string, locale: SiteLocale) { return new Intl.DateTimeFormat(toIntlLocale(locale), { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function formatBytes(value: number, locale: SiteLocale) { return value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${new Intl.NumberFormat(toIntlLocale(locale), { maximumFractionDigits: 1 }).format(value / 1024 / 1024)} MB`; }
function initials(value: string, locale: SiteLocale) { return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase(toIntlLocale(locale)); }

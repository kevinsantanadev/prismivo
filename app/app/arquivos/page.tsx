import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, Files, HardDrive, ShieldCheck } from "lucide-react";
import { requireSessionUser } from "@/app/session-auth";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";
import { getRequestLocale } from "@/lib/site-locale-server";
import { findWorkspaceByEmail, getFilesData, getProjectsData, getUnreadNotificationCount } from "@/lib/workspace";
import { AppShell } from "../components/app-shell";
import { FileDelete } from "../components/file-delete";
import { FileUpload } from "../components/file-upload";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Arquivos", description: "Arquivos privados da empresa no Prismivo.", robots: { index: false, follow: false } };

export default async function FilesPage() {
  const identity = await requireSessionUser("/app/arquivos");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  const [files, projects, unreadCount, locale] = await Promise.all([
    getFilesData(workspace.organizationId),
    getProjectsData(workspace.organizationId),
    getUnreadNotificationCount(workspace.userId),
    getRequestLocale(),
  ]);
  const copy = getOperationalCopy(locale);
  const totalBytes = files.reduce((total, file) => total + file.sizeBytes, 0);
  const projectFiles = files.filter((file) => file.projectId).length;

  return (
    <AppShell active="files" title="Arquivos" description="Documentos privados e vinculados" workspace={workspace} unreadCount={unreadCount}>
      <section className="app-page-intro"><div><span className="eyebrow">{copy.files.eyebrow}</span><h1>{copy.files.title}</h1><p>{copy.files.intro}</p></div><FileUpload locale={locale} projects={projects.map(({ id, name }) => ({ id, name }))} /></section>
      <section className="app-summary-strip" aria-label={copy.files.summaryAria}>
        <article><Files aria-hidden="true" /><span><strong>{files.length}</strong><small>{copy.files.active}</small></span></article>
        <article><HardDrive aria-hidden="true" /><span><strong>{formatBytes(totalBytes, locale)}</strong><small>{copy.files.stored}</small></span></article>
        <article><ShieldCheck aria-hidden="true" /><span><strong>{projectFiles}</strong><small>{copy.files.linked}</small></span></article>
      </section>
      <section className="dashboard-panel detail-section" aria-labelledby="file-list-title">
        <div className="section-mini-heading"><span className="panel-kicker">{copy.files.repository}</span><h2 id="file-list-title">{copy.files.available}</h2></div>
        {files.length === 0 ? <div className="empty-state"><Files aria-hidden="true" /><h3>{copy.files.empty}</h3><p>{copy.files.emptyDetail}</p></div> : <div className="file-list">{files.map((file) => (
          <article key={file.id}><span className="file-icon"><Files aria-hidden="true" /></span><div><strong>{file.originalName}</strong><small>{formatBytes(file.sizeBytes, locale)} · {file.uploaderName} · {formatDate(file.createdAt, locale)}</small>{file.projectId ? <Link href={`/app/projetos/${file.projectId}`}>{file.projectName}</Link> : <span>{copy.files.general}</span>}</div><a href={`/api/files/${file.id}/download`}><Download aria-hidden="true" />{copy.files.download}</a><FileDelete id={file.id} name={file.originalName} locale={locale} /></article>
        ))}</div>}
      </section>
    </AppShell>
  );
}

function formatBytes(value: number, locale: SiteLocale) {
  if (value === 0) return "0 KB";
  return value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${new Intl.NumberFormat(toIntlLocale(locale), { maximumFractionDigits: 1 }).format(value / 1024 / 1024)} MB`;
}

function formatDate(value: string, locale: SiteLocale) {
  const date = new Date(value.replace(" ", "T") + "Z");
  return new Intl.DateTimeFormat(toIntlLocale(locale), { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" }).format(date);
}

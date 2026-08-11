import type { Metadata } from "next";
import { FileText, LibraryBig } from "lucide-react";
import { redirect } from "next/navigation";
import { requireSessionUser } from "@/app/session-auth";
import { getOperationalCopy } from "@/lib/app-operational-i18n";
import { hasPermission } from "@/lib/permissions";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";
import { getRequestLocale } from "@/lib/site-locale-server";
import { getOrganizationContent } from "@/lib/supabase/content";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { findWorkspaceByEmail, getUnreadNotificationCount } from "@/lib/workspace";
import { AppShell } from "../components/app-shell";
import { ContentForm } from "../components/content-form";
import { ContentStatusActions } from "../components/content-status-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Estúdio de conteúdo", description: "Conteúdo estruturado da organização.", robots: { index: false, follow: false } };

export default async function ContentStudioPage() {
  const identity = await requireSessionUser("/app/conteudo");
  const workspace = await findWorkspaceByEmail(identity.email);
  if (!workspace) redirect("/app/onboarding");
  if (!isSupabaseConfigured() || !hasPermission(workspace.role, "content.write")) redirect("/app");
  const [items, unreadCount, locale] = await Promise.all([getOrganizationContent(workspace.organizationId), getUnreadNotificationCount(workspace.userId), getRequestLocale()]);
  const copy = getOperationalCopy(locale).content;
  const published = items.filter((item) => item.status === "published").length;
  const drafts = items.filter((item) => item.status === "draft").length;

  return <AppShell active="content" title={copy.recent} description={copy.library} workspace={workspace} unreadCount={unreadCount}>
    <section className="app-page-intro compact-intro"><div><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p></div><ContentForm locale={locale} /></section>
    <section className="content-studio-metrics" aria-label={copy.summaryAria}><article><LibraryBig aria-hidden="true" /><span>{copy.total}</span><strong>{items.length}</strong></article><article><FileText aria-hidden="true" /><span>{copy.published}</span><strong>{published}</strong></article><article><FileText aria-hidden="true" /><span>{copy.drafts}</span><strong>{drafts}</strong></article></section>
    <section className="dashboard-panel" aria-labelledby="content-list-title"><div className="panel-heading"><div><span className="panel-kicker">{copy.library}</span><h2 id="content-list-title">{copy.recent}</h2></div><LibraryBig aria-hidden="true" /></div>{items.length === 0 ? <div className="empty-state"><FileText aria-hidden="true" /><h3>{copy.empty}</h3><p>{copy.emptyDetail}</p></div> : <div className="content-studio-list">{items.map((item) => <article key={item.id}><div><span className={`content-status content-status-${item.status}`}>{label(copy.statuses, item.status)}</span><small>{label(copy.kinds, item.kind === "case_study" ? "caseStudy" : item.kind)} · {copy.updatedAt(formatDate(item.updated_at, locale))}</small><h3>{item.title}</h3><p>{item.excerpt}</p><div className="content-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><ContentStatusActions id={item.id} status={item.status} locale={locale} /></article>)}</div>}</section>
  </AppShell>;
}

function label(values: Record<string, string>, value: string) { return values[value] ?? value; }
function formatDate(value: string, locale: SiteLocale) { return new Intl.DateTimeFormat(toIntlLocale(locale), { dateStyle: "medium" }).format(new Date(value)); }

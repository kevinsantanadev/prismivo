import type { Metadata } from "next";
import { FileText, LibraryBig } from "lucide-react";
import { redirect } from "next/navigation";
import { requireSessionUser } from "@/app/session-auth";
import { hasPermission } from "@/lib/permissions";
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
  const [items, unreadCount] = await Promise.all([
    getOrganizationContent(workspace.organizationId),
    getUnreadNotificationCount(workspace.userId),
  ]);

  const published = items.filter((item) => item.status === "published").length;
  const drafts = items.filter((item) => item.status === "draft").length;

  return <AppShell active="content" title="Estúdio de conteúdo" description="Rascunhos, publicações e materiais" workspace={workspace} unreadCount={unreadCount}>
    <section className="app-page-intro compact-intro"><div><span className="eyebrow">MARCO 9 · CONTEÚDO ESTRUTURADO</span><h1>Conhecimento pronto para evoluir sem se perder.</h1><p>Crie materiais com endereço próprio, estado editorial, tags e histórico dentro do isolamento da empresa.</p></div><ContentForm /></section>
    <section className="content-studio-metrics" aria-label="Resumo editorial"><article><LibraryBig aria-hidden="true" /><span>Total</span><strong>{items.length}</strong></article><article><FileText aria-hidden="true" /><span>Publicados</span><strong>{published}</strong></article><article><FileText aria-hidden="true" /><span>Rascunhos</span><strong>{drafts}</strong></article></section>
    <section className="dashboard-panel" aria-labelledby="content-list-title"><div className="panel-heading"><div><span className="panel-kicker">BIBLIOTECA DA EMPRESA</span><h2 id="content-list-title">Materiais recentes</h2></div><LibraryBig aria-hidden="true" /></div>
      {items.length === 0 ? <div className="empty-state"><FileText aria-hidden="true" /><h3>Seu estúdio está pronto</h3><p>Crie o primeiro artigo, caso, serviço ou tutorial da organização.</p></div> : <div className="content-studio-list">{items.map((item) => <article key={item.id}><div><span className={`content-status content-status-${item.status}`}>{statusLabel(item.status)}</span><small>{kindLabel(item.kind)} · atualizado em {formatDate(item.updated_at)}</small><h3>{item.title}</h3><p>{item.excerpt}</p><div className="content-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><ContentStatusActions id={item.id} status={item.status} /></article>)}</div>}
    </section>
  </AppShell>;
}

function statusLabel(status: string) {
  return ({ draft: "Rascunho", published: "Publicado", archived: "Arquivado" } as Record<string, string>)[status] ?? status;
}

function kindLabel(kind: string) {
  return ({ article: "Artigo", case_study: "Caso", service: "Serviço", help: "Ajuda" } as Record<string, string>)[kind] ?? kind;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
}

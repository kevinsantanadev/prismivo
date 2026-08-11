import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, Search } from "lucide-react";
import { contentCategory, getPublicContent, type ContentKind } from "@/lib/supabase/content";
import { ContentHeader } from "./content-header";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Central de conteúdo",
  description: "Artigos sobre operações, experiência do cliente, produto e segurança.",
  alternates: { canonical: "/conteudo" },
  openGraph: { title: "Central de conteúdo | Prismivo", description: "Conhecimento prático para operações de serviços mais claras.", url: "/conteudo" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ContentHubPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const query = first(raw.query).slice(0, 100);
  const category = safeSlug(first(raw.category));
  const kind = safeKind(first(raw.kind));
  const items = await getPublicContent({ locale: "pt-BR", query, category, kind });
  const allItems = await getPublicContent({ locale: "pt-BR" });
  const categories = [...new Map(allItems.map((item) => contentCategory(item)).filter(Boolean).map((item) => [item!.slug, item!])).values()];
  const featured = items.find((item) => item.featured) ?? items[0];
  const remaining = featured ? items.filter((item) => item.id !== featured.id) : [];

  return <div className="content-site-shell"><a className="skip-link" href="#content-results">Pular para os conteúdos</a><ContentHeader /><main>
    <section className="content-hero"><span className="eyebrow">CENTRAL DE CONTEÚDO</span><h1>Conhecimento para operações que precisam crescer com clareza.</h1><p>Práticas autorais sobre processos, experiência do cliente, acessibilidade, dados e segurança em produtos B2B.</p></section>
    <section className="content-search-panel" aria-label="Pesquisa e filtros"><form method="get"><div className="content-search-input"><Search aria-hidden="true" /><label className="sr-only" htmlFor="content-query">Pesquisar conteúdo</label><input id="content-query" name="query" defaultValue={query} maxLength={100} placeholder="Pesquisar por assunto, título ou tag" /></div><label><span>Formato</span><select name="kind" defaultValue={kind}><option value="all">Todos</option><option value="article">Artigos</option><option value="case_study">Casos</option><option value="service">Serviços</option><option value="help">Ajuda</option></select></label><label><span>Categoria</span><select name="category" defaultValue={category}><option value="">Todas</option>{categories.map((item) => <option value={item.slug} key={item.slug}>{item.name}</option>)}</select></label><button className="button" type="submit">Aplicar</button></form></section>
    <section id="content-results" className="content-results" aria-labelledby="content-results-title"><div className="content-results-heading"><div><span className="eyebrow">PUBLICAÇÕES</span><h2 id="content-results-title">{items.length} {items.length === 1 ? "conteúdo encontrado" : "conteúdos encontrados"}</h2></div>{(query || category || kind !== "all") && <Link href="/conteudo">Limpar filtros</Link>}</div>
      {items.length === 0 ? <div className="content-empty"><Search aria-hidden="true" /><h3>Nenhum conteúdo corresponde à busca</h3><p>Experimente outro termo ou remova um dos filtros.</p></div> : <><div className="content-featured">{featured && <ContentCard item={featured} featured />}</div><div className="content-card-grid">{remaining.map((item) => <ContentCard item={item} key={item.id} />)}</div></>}
    </section>
  </main><footer className="content-site-footer"><Link className="brand" href="/"><span className="brand-mark" aria-hidden="true"><span /></span><span>PRISMIVO</span></Link><p>Conteúdo autoral para avaliação profissional e estudo. Reutilização não autorizada.</p><span>© 2026 Prismivo.</span></footer></div>;
}

function ContentCard({ item, featured = false }: { item: Awaited<ReturnType<typeof getPublicContent>>[number]; featured?: boolean }) {
  const category = contentCategory(item);
  return <article className={featured ? "content-card content-card-featured" : "content-card"}><div className="content-card-art" aria-hidden="true"><BookOpenText /></div><div><span>{category?.name ?? kindLabel(item.kind)} · {item.reading_minutes} min</span><h3>{item.title}</h3><p>{item.excerpt}</p><div className="content-tags">{item.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div><Link href={`/conteudo/${item.slug}`}>Ler conteúdo<ArrowRight aria-hidden="true" /></Link></div></article>;
}

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

function safeSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : "";
}

function safeKind(value: string): ContentKind | "all" {
  return (["article", "case_study", "service", "help"] as const).includes(value as ContentKind) ? value as ContentKind : "all";
}

function kindLabel(value: ContentKind) {
  return ({ article: "Artigo", case_study: "Caso", service: "Serviço", help: "Ajuda" })[value];
}

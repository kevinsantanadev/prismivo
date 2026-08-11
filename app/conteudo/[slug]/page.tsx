import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, Share2 } from "lucide-react";
import { notFound } from "next/navigation";
import { contentCategory, getPublicContent, getPublicContentBySlug } from "@/lib/supabase/content";
import { ContentHeader } from "../content-header";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicContentBySlug(slug);
  if (!item) return { title: "Conteúdo não encontrado", robots: { index: false, follow: false } };
  return {
    title: item.seo_title || item.title,
    description: item.seo_description || item.excerpt,
    alternates: { canonical: `/conteudo/${item.slug}` },
    openGraph: { type: "article", title: item.title, description: item.excerpt, url: `/conteudo/${item.slug}`, publishedTime: item.published_at ?? undefined, tags: item.tags },
  };
}

export default async function ContentArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getPublicContentBySlug(slug);
  if (!item) notFound();
  const related = (await getPublicContent({ locale: item.locale, kind: item.kind })).filter((candidate) => candidate.id !== item.id).slice(0, 3);
  const category = contentCategory(item);
  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: item.title, description: item.excerpt, datePublished: item.published_at, dateModified: item.updated_at, publisher: { "@type": "Organization", name: "Prismivo", url: "https://prismivo.kevinsantanadev.com.br" }, mainEntityOfPage: `https://prismivo.kevinsantanadev.com.br/conteudo/${item.slug}` };

  return <div className="content-site-shell"><a className="skip-link" href="#article-body">Pular para o artigo</a><ContentHeader /><main className="article-main"><article><Link className="article-back" href="/conteudo"><ArrowLeft aria-hidden="true" />Voltar à central</Link><header className="article-header"><span className="eyebrow">{category?.name ?? "Conteúdo"}</span><h1>{item.title}</h1><p>{item.excerpt}</p><div><span><CalendarDays aria-hidden="true" />{formatDate(item.published_at)}</span><span><Clock3 aria-hidden="true" />{item.reading_minutes} min de leitura</span><span><Share2 aria-hidden="true" />Endereço permanente</span></div></header><div id="article-body" className="article-body">{item.body.split(/\n{2,}/u).map((paragraph) => <p key={paragraph.slice(0, 80)}>{paragraph}</p>)}</div><footer className="article-tags" aria-label="Tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</footer></article>
    {related.length > 0 && <section className="article-related" aria-labelledby="related-title"><span className="eyebrow">CONTINUE EXPLORANDO</span><h2 id="related-title">Conteúdos relacionados</h2><div>{related.map((candidate) => <article key={candidate.id}><span>{contentCategory(candidate)?.name ?? "Prismivo"}</span><h3>{candidate.title}</h3><p>{candidate.excerpt}</p><Link href={`/conteudo/${candidate.slug}`}>Ler artigo</Link></article>)}</div></section>}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }} />
  </main></div>;
}

function formatDate(value: string | null) {
  if (!value) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(value));
}

import type { MutationResult } from "./mutations";
import { isSupabaseConfigured } from "./config";
import { createSupabaseServerClient } from "./server";

const PUBLIC_CONTENT_LIMIT = 100;

export type ContentKind = "article" | "case_study" | "service" | "help";
export type ContentStatus = "draft" | "published" | "archived";

export type ContentItem = {
  id: string;
  organization_id: string | null;
  kind: ContentKind;
  locale: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  status: ContentStatus;
  featured: boolean;
  reading_minutes: number;
  seo_title: string;
  seo_description: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category: { name: string; slug: string } | Array<{ name: string; slug: string }> | null;
};

type Workspace = { userId: string; organizationId: string };
type ContentInput = {
  kind: ContentKind;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  status: "draft" | "published";
};

export async function getPublicContent(filters: {
  locale?: string;
  kind?: ContentKind | "all";
  category?: string;
  query?: string;
} = {}): Promise<ContentItem[]> {
  if (!isSupabaseConfigured()) return filterPublicContent(fallbackPublicContent, filters);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("content_items")
    .select("id, organization_id, kind, locale, slug, title, excerpt, body, tags, status, featured, reading_minutes, seo_title, seo_description, published_at, created_at, updated_at, category:content_categories(name, slug)")
    .is("organization_id", null)
    .eq("locale", filters.locale ?? "pt-BR")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(PUBLIC_CONTENT_LIMIT);
  if (error) throw error;

  return filterPublicContent((data ?? []) as ContentItem[], filters);
}

function filterPublicContent(items: ContentItem[], filters: { locale?: string; kind?: ContentKind | "all"; category?: string; query?: string }) {
  const normalizedQuery = (filters.query ?? "").trim().toLocaleLowerCase("pt-BR");
  return items.filter((item) => {
    if (filters.locale && item.locale !== filters.locale) return false;
    if (filters.kind && filters.kind !== "all" && item.kind !== filters.kind) return false;
    const category = contentCategory(item);
    if (filters.category && category?.slug !== filters.category) return false;
    if (!normalizedQuery) return true;
    return [item.title, item.excerpt, item.tags.join(" ")]
      .some((value) => value.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
  });
}

export async function getPublicContentBySlug(slug: string, locale = "pt-BR"): Promise<ContentItem | null> {
  if (!isSupabaseConfigured()) return fallbackPublicContent.find((item) => item.slug === slug && item.locale === locale) ?? null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("content_items")
    .select("id, organization_id, kind, locale, slug, title, excerpt, body, tags, status, featured, reading_minutes, seo_title, seo_description, published_at, created_at, updated_at, category:content_categories(name, slug)")
    .is("organization_id", null)
    .eq("locale", locale)
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return data as ContentItem | null;
}

export async function getOrganizationContent(organizationId: string): Promise<ContentItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("content_items")
    .select("id, organization_id, kind, locale, slug, title, excerpt, body, tags, status, featured, reading_minutes, seo_title, seo_description, published_at, created_at, updated_at, category:content_categories(name, slug)")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false })
    .limit(PUBLIC_CONTENT_LIMIT);
  if (error) throw error;
  return (data ?? []) as ContentItem[];
}

export async function createContentItem(
  workspace: Workspace,
  input: ContentInput,
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient();
  const id = `cnt_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const { error } = await supabase.from("content_items").insert({
    id,
    organization_id: workspace.organizationId,
    author_user_id: workspace.userId,
    kind: input.kind,
    locale: "pt-BR",
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    body: input.body,
    tags: input.tags,
    status: input.status,
    reading_minutes: estimateReadingTime(input.body),
    seo_title: input.title.slice(0, 70),
    seo_description: input.excerpt.slice(0, 180),
    published_at: input.status === "published" ? now : null,
    updated_at: now,
  });
  if (error?.code === "23505") return failure("CONTENT_SLUG_IN_USE", "Este endereço já está sendo usado.", 409);
  if (error) return failure("CONTENT_CREATE_FAILED", "Não foi possível criar o conteúdo agora.", 500);
  await supabase.from("activities").insert({
    organization_id: workspace.organizationId,
    actor_user_id: workspace.userId,
    type: "content.created",
    title: "Conteúdo criado",
    detail: input.title,
    resource_type: "content",
    resource_id: id,
  });
  return { ok: true, data: { id } };
}

export async function updateContentStatus(
  workspace: Workspace,
  id: string,
  status: ContentStatus,
): Promise<MutationResult<{ id: string; status: ContentStatus }>> {
  const supabase = await createSupabaseServerClient();
  const { data: existing, error: lookupError } = await supabase
    .from("content_items")
    .select("id, title")
    .eq("organization_id", workspace.organizationId)
    .eq("id", id)
    .maybeSingle();
  if (lookupError) return failure("CONTENT_UPDATE_FAILED", "Não foi possível atualizar o conteúdo.", 500);
  if (!existing) return failure("CONTENT_NOT_FOUND", "Conteúdo não encontrado.", 404);

  const now = new Date().toISOString();
  const { error } = await supabase.from("content_items").update({
    status,
    published_at: status === "published" ? now : null,
    updated_at: now,
  }).eq("organization_id", workspace.organizationId).eq("id", id);
  if (error) return failure("CONTENT_UPDATE_FAILED", "Não foi possível atualizar o conteúdo.", 500);
  await supabase.from("activities").insert({
    organization_id: workspace.organizationId,
    actor_user_id: workspace.userId,
    type: `content.${status}`,
    title: "Estado do conteúdo atualizado",
    detail: existing.title,
    resource_type: "content",
    resource_id: id,
  });
  return { ok: true, data: { id, status } };
}

export function contentCategory(item: Pick<ContentItem, "category">) {
  return Array.isArray(item.category) ? item.category[0] ?? null : item.category;
}

function estimateReadingTime(body: string) {
  const words = body.trim().split(/\s+/u).filter(Boolean).length;
  return Math.max(1, Math.min(180, Math.ceil(words / 210)));
}

function failure(code: string, message: string, status: number): MutationResult<never> {
  return { ok: false, code, message, status };
}

const fallbackSeeds = [
  ["operacoes-conectadas", "Como conectar a operação sem criar mais ruído", "Um método prático para reunir decisões, entregas e responsabilidades sem transformar a rotina em burocracia.", "Operações", "operacoes", ["operações", "processos", "gestão"]],
  ["aprovacoes-sem-atrito", "Aprovações de clientes sem atrito e sem perda de contexto", "Estruture entregas, critérios e decisões para reduzir retrabalho e manter uma trilha confiável.", "Experiência do cliente", "experiencia-do-cliente", ["aprovações", "clientes", "workflow"]],
  ["seguranca-multitenant", "Segurança multitenant: isolamento precisa existir no banco", "Entenda por que filtrar dados apenas na interface não protege organizações em uma plataforma SaaS.", "Segurança", "seguranca", ["segurança", "postgresql", "rls"]],
  ["onboarding-que-gera-valor", "Onboarding que leva o usuário ao primeiro valor real", "Troque listas genéricas de passos por uma jornada curta, contextual e mensurável.", "Produto", "produto", ["produto", "onboarding", "ux"]],
  ["metricas-operacionais-uteis", "Métricas operacionais que ajudam a decidir", "Escolha indicadores que revelem gargalos, ritmo e qualidade em vez de números decorativos.", "Operações", "operacoes", ["métricas", "relatórios", "decisão"]],
  ["acessibilidade-em-produtos-b2b", "Acessibilidade em produtos B2B é qualidade de operação", "Navegação por teclado, contraste e mensagens claras reduzem barreiras e também erros cotidianos.", "Produto", "produto", ["acessibilidade", "wcag", "design-system"]],
  ["atendimento-com-historico", "Atendimento com histórico transforma suporte em aprendizado", "Protocolos, estados e conversas estruturadas ajudam a equipe a resolver e melhorar o produto.", "Experiência do cliente", "experiencia-do-cliente", ["atendimento", "suporte", "histórico"]],
  ["governanca-de-arquivos", "Governança de arquivos além do botão de upload", "Validação, propriedade e exclusão lógica tornam documentos úteis sem abrir novas brechas.", "Segurança", "seguranca", ["arquivos", "segurança", "governança"]],
] as const;

const fallbackPublicContent: ContentItem[] = fallbackSeeds.map(([slug, title, excerpt, categoryName, categorySlug, tags], index) => ({
  id: `fallback-${index + 1}`,
  organization_id: null,
  kind: "article",
  locale: "pt-BR",
  slug,
  title,
  excerpt,
  body: `${excerpt}\n\nEste conteúdo apresenta uma abordagem prática, rastreável e proporcional à maturidade da operação. O ponto de partida é definir responsabilidades, registrar mudanças importantes e transformar dados confiáveis em próximos passos compreensíveis para a equipe e para o cliente.\n\nA implementação deve preservar acessibilidade, privacidade e segurança desde a primeira decisão. Assim, o processo pode crescer sem depender de controles improvisados nem perder o contexto que sustenta cada escolha.`,
  tags: [...tags],
  status: "published",
  featured: index < 3,
  reading_minutes: 4 + (index % 3),
  seo_title: title.slice(0, 70),
  seo_description: excerpt.slice(0, 180),
  published_at: new Date(Date.UTC(2026, 5, 1 + index * 7)).toISOString(),
  created_at: new Date(Date.UTC(2026, 5, 1 + index * 7)).toISOString(),
  updated_at: new Date(Date.UTC(2026, 5, 1 + index * 7)).toISOString(),
  category: { name: categoryName, slug: categorySlug },
}));

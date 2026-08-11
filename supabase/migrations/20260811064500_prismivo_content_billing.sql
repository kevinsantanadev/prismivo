-- Marco 9 — conteúdo publicável e cobrança demonstrativa.
-- Toda informação de empresa permanece isolada por organização e protegida por RLS.

create table public.content_categories (
  id text primary key default ('ctg_' || gen_random_uuid()::text),
  organization_id text references public.organizations(id) on delete cascade,
  locale text not null default 'pt-BR' check (locale in ('pt-BR', 'en', 'es')),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (organization_id, locale, slug)
);

create index content_categories_organization_idx on public.content_categories(organization_id);

create table public.content_tags (
  id text primary key default ('tag_' || gen_random_uuid()::text),
  organization_id text references public.organizations(id) on delete cascade,
  locale text not null default 'pt-BR' check (locale in ('pt-BR', 'en', 'es')),
  name text not null check (char_length(name) between 2 and 48),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  unique nulls not distinct (organization_id, locale, slug)
);

create index content_tags_organization_idx on public.content_tags(organization_id);

create table public.content_items (
  id text primary key default ('cnt_' || gen_random_uuid()::text),
  organization_id text references public.organizations(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  category_id text references public.content_categories(id) on delete set null,
  kind text not null check (kind in ('article', 'case_study', 'service', 'help')),
  locale text not null default 'pt-BR' check (locale in ('pt-BR', 'en', 'es')),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 4 and 160),
  excerpt text not null check (char_length(excerpt) between 20 and 320),
  body text not null check (char_length(body) between 80 and 30000),
  cover_alt text not null default '' check (char_length(cover_alt) <= 180),
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  reading_minutes integer not null default 4 check (reading_minutes between 1 and 180),
  seo_title text not null default '' check (char_length(seo_title) <= 70),
  seo_description text not null default '' check (char_length(seo_description) <= 180),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (organization_id, locale, slug)
);

create index content_items_category_idx on public.content_items(category_id);
create index content_items_author_idx on public.content_items(author_user_id);
create index content_items_org_status_published_idx on public.content_items(organization_id, status, published_at desc);
create index content_items_public_locale_published_idx on public.content_items(locale, published_at desc)
  where organization_id is null and status = 'published';
create index content_items_tags_idx on public.content_items using gin(tags);

create table public.plans (
  code text primary key check (code in ('free', 'professional', 'scale')),
  name text not null unique,
  description text not null,
  monthly_price_cents integer not null check (monthly_price_cents >= 0),
  annual_price_cents integer not null check (annual_price_cents >= 0),
  currency text not null default 'BRL' check (currency = 'BRL'),
  limits jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id text primary key default ('sub_' || gen_random_uuid()::text),
  organization_id text not null unique references public.organizations(id) on delete cascade,
  plan_code text not null references public.plans(code) on delete restrict,
  billing_cycle text not null check (billing_cycle in ('monthly', 'annual')),
  status text not null check (status in ('trialing', 'active', 'past_due', 'cancelled')),
  provider text not null default 'demo' check (provider in ('demo', 'stripe')),
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_plan_idx on public.subscriptions(plan_code);
create index subscriptions_status_period_idx on public.subscriptions(status, current_period_end);

create table public.billing_events (
  id text primary key default ('bil_' || gen_random_uuid()::text),
  organization_id text not null references public.organizations(id) on delete cascade,
  subscription_id text references public.subscriptions(id) on delete set null,
  type text not null,
  amount_cents integer not null default 0 check (amount_cents >= 0),
  currency text not null default 'BRL' check (currency = 'BRL'),
  status text not null check (status in ('simulated', 'pending', 'paid', 'failed', 'refunded')),
  external_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index billing_events_organization_created_idx on public.billing_events(organization_id, created_at desc);
create index billing_events_subscription_idx on public.billing_events(subscription_id);

alter table public.content_categories enable row level security;
alter table public.content_tags enable row level security;
alter table public.content_items enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_events enable row level security;

create policy content_categories_public_select on public.content_categories for select to anon, authenticated
  using (organization_id is null or private.has_org_access(organization_id));
create policy content_categories_editor_insert on public.content_categories for insert to authenticated
  with check (organization_id is not null and private.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy content_categories_editor_update on public.content_categories for update to authenticated
  using (organization_id is not null and private.has_org_role(organization_id, array['owner', 'admin', 'editor']))
  with check (organization_id is not null and private.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy content_categories_editor_delete on public.content_categories for delete to authenticated
  using (organization_id is not null and private.has_org_role(organization_id, array['owner', 'admin', 'editor']));

create policy content_tags_public_select on public.content_tags for select to anon, authenticated
  using (organization_id is null or private.has_org_access(organization_id));
create policy content_tags_editor_insert on public.content_tags for insert to authenticated
  with check (organization_id is not null and private.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy content_tags_editor_update on public.content_tags for update to authenticated
  using (organization_id is not null and private.has_org_role(organization_id, array['owner', 'admin', 'editor']))
  with check (organization_id is not null and private.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy content_tags_editor_delete on public.content_tags for delete to authenticated
  using (organization_id is not null and private.has_org_role(organization_id, array['owner', 'admin', 'editor']));

create policy content_items_public_select on public.content_items for select to anon
  using (organization_id is null and status = 'published' and published_at <= now());
create policy content_items_authenticated_select on public.content_items for select to authenticated
  using (
    (organization_id is null and status = 'published' and published_at <= now())
    or private.has_org_access(organization_id)
  );
create policy content_items_editor_insert on public.content_items for insert to authenticated
  with check (
    organization_id is not null
    and author_user_id = (select auth.uid())
    and private.has_org_role(organization_id, array['owner', 'admin', 'editor'])
  );
create policy content_items_editor_update on public.content_items for update to authenticated
  using (organization_id is not null and private.has_org_role(organization_id, array['owner', 'admin', 'editor']))
  with check (organization_id is not null and private.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy content_items_editor_delete on public.content_items for delete to authenticated
  using (organization_id is not null and private.has_org_role(organization_id, array['owner', 'admin']));

create policy plans_public_select on public.plans for select to anon, authenticated using (active = true);
create policy subscriptions_admin_select on public.subscriptions for select to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));
create policy billing_events_admin_select on public.billing_events for select to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

revoke insert, update, delete on public.plans from anon, authenticated;
revoke insert, update, delete on public.subscriptions from anon, authenticated;
revoke insert, update, delete on public.billing_events from anon, authenticated;

insert into public.plans(code, name, description, monthly_price_cents, annual_price_cents, limits, sort_order)
values
  ('free', 'Inicial', 'Para organizar a primeira carteira com clareza.', 0, 0, '{"clients":3,"active_projects":3,"storage_mb":100,"team_members":1}'::jsonb, 1),
  ('professional', 'Studio', 'Para equipes que conduzem operações recorrentes com clientes.', 14900, 142800, '{"clients":50,"active_projects":50,"storage_mb":10240,"team_members":10}'::jsonb, 2),
  ('scale', 'Escala', 'Para operações maduras que precisam de governança e volume.', 34900, 334800, '{"clients":-1,"active_projects":-1,"storage_mb":51200,"team_members":30}'::jsonb, 3)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  monthly_price_cents = excluded.monthly_price_cents,
  annual_price_cents = excluded.annual_price_cents,
  limits = excluded.limits,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.content_categories(organization_id, locale, name, slug, description)
values
  (null, 'pt-BR', 'Operações', 'operacoes', 'Processos, indicadores e rotinas para serviços profissionais.'),
  (null, 'pt-BR', 'Experiência do cliente', 'experiencia-do-cliente', 'Práticas para conduzir relações transparentes e previsíveis.'),
  (null, 'pt-BR', 'Segurança', 'seguranca', 'Proteção de dados, acesso e governança em produtos digitais.'),
  (null, 'pt-BR', 'Produto', 'produto', 'Decisões de produto, acessibilidade e evolução sustentável.')
on conflict (organization_id, locale, slug) do nothing;

insert into public.content_items(
  organization_id, author_user_id, category_id, kind, locale, slug, title, excerpt, body,
  cover_alt, tags, status, featured, reading_minutes, seo_title, seo_description, published_at
)
select
  null,
  null,
  category.id,
  seed.kind,
  'pt-BR',
  seed.slug,
  seed.title,
  seed.excerpt,
  seed.body,
  seed.cover_alt,
  seed.tags,
  'published',
  seed.featured,
  seed.reading_minutes,
  seed.seo_title,
  seed.seo_description,
  seed.published_at
from (values
  ('article', 'operacoes-conectadas', 'Como conectar a operação sem criar mais ruído', 'Um método prático para reunir decisões, entregas e responsabilidades sem transformar a rotina em burocracia.', 'Uma operação conectada começa pela definição de uma fonte confiável para cada decisão. Projetos, aprovações, arquivos e conversas precisam compartilhar o mesmo contexto, mas não necessariamente a mesma tela. O objetivo é reduzir reconstruções de histórico e tornar o próximo passo evidente.\n\nA implementação deve começar pequena: mapear o fluxo principal, definir responsáveis e registrar eventos que mudam o estado do trabalho. Indicadores só ganham valor depois que os dados representam a rotina real. Com essa base, automações e relatórios deixam de ser efeitos visuais e passam a apoiar decisões.', 'Diagrama abstrato de etapas operacionais conectadas', array['operações','processos','gestão'], true, 5, 'Operações conectadas sem mais ruído', 'Aprenda a estruturar decisões, entregas e responsabilidades em uma operação de serviços conectada.', 'operacoes', now() - interval '56 days'),
  ('article', 'aprovacoes-sem-atrito', 'Aprovações de clientes sem atrito e sem perda de contexto', 'Estruture entregas, critérios e decisões para reduzir retrabalho e manter uma trilha confiável.', 'Uma boa aprovação não começa no botão de aceitar. Ela começa na forma como a entrega é apresentada: objetivo, versão, critérios e prazo precisam estar claros. Quando esses elementos ficam dispersos, o cliente responde sem contexto e a equipe perde tempo reconstruindo o que mudou.\n\nCentralizar a decisão permite distinguir aprovação, pedido de ajuste e comentário. Cada resposta deve registrar autoria e data, manter o histórico e gerar a próxima ação. Assim, a experiência do cliente melhora ao mesmo tempo em que a equipe ganha previsibilidade.', 'Cartões de aprovação organizados em uma linha do tempo', array['aprovações','clientes','workflow'], true, 4, 'Aprovações de clientes sem atrito', 'Organize aprovações com contexto, critérios claros e histórico rastreável.', 'experiencia-do-cliente', now() - interval '49 days'),
  ('article', 'seguranca-multitenant', 'Segurança multitenant: isolamento precisa existir no banco', 'Entenda por que filtrar dados apenas na interface não protege organizações em uma plataforma SaaS.', 'Em um produto multitenant, cada registro pertence a uma organização. Aplicar o filtro apenas no navegador ou no backend cria um ponto único de falha: uma rota esquecida pode expor dados de outra empresa. O banco deve participar da autorização por meio de políticas de linha.\n\nRow Level Security, índices nas colunas usadas pelas políticas e checagem de papéis no servidor formam uma defesa em profundidade. Logs também precisam ser mínimos e seguros, sem senhas, tokens ou dados financeiros completos. Segurança útil é aquela que permanece ativa mesmo quando uma camada comete um erro.', 'Camadas translúcidas representando isolamento entre organizações', array['segurança','postgresql','rls'], true, 6, 'Segurança multitenant com RLS', 'Como combinar autorização no servidor e Row Level Security para isolar organizações.', 'seguranca', now() - interval '42 days'),
  ('article', 'onboarding-que-gera-valor', 'Onboarding que leva o usuário ao primeiro valor real', 'Troque listas genéricas de passos por uma jornada curta, contextual e mensurável.', 'O onboarding deve conduzir a uma conquista concreta, não apenas apresentar menus. Para uma plataforma operacional, o primeiro valor pode ser criar a empresa, cadastrar um cliente e abrir um projeto. Cada etapa precisa explicar por que existe e preservar o progresso.\n\nDados demonstrativos ajudam quando são identificados claramente e podem ser removidos. Estados vazios, recomendações e mensagens de erro completam a experiência. A métrica mais útil não é quantas telas foram vistas, mas quantas pessoas concluíram uma ação que melhora sua rotina.', 'Sequência de três passos concluídos em um painel', array['produto','onboarding','ux'], false, 5, 'Onboarding orientado ao primeiro valor', 'Projete uma jornada inicial curta, contextual e focada em uma conquista real.', 'produto', now() - interval '35 days'),
  ('article', 'metricas-operacionais-uteis', 'Métricas operacionais que ajudam a decidir', 'Escolha indicadores que revelem gargalos, ritmo e qualidade em vez de números decorativos.', 'Métricas úteis respondem a uma pergunta de negócio. Tempo médio de aprovação revela fricção, chamados reabertos mostram qualidade de resolução e projetos sem atividade indicam risco. Um painel deve aproximar o indicador da ação que ele recomenda.\n\nAntes de comparar períodos, padronize eventos e fusos horários. Permita filtros previsíveis e exportações seguras. Volumes muito grandes exigem agregação no banco, paginação e limites explícitos. O indicador precisa ser reproduzível, compreensível e proporcional à maturidade da operação.', 'Gráfico de barras acompanhado por perguntas de negócio', array['métricas','relatórios','decisão'], false, 5, 'Métricas operacionais para decisões melhores', 'Defina indicadores reproduzíveis que revelem gargalos e orientem ações.', 'operacoes', now() - interval '28 days'),
  ('article', 'acessibilidade-em-produtos-b2b', 'Acessibilidade em produtos B2B é qualidade de operação', 'Navegação por teclado, contraste e mensagens claras reduzem barreiras e também erros cotidianos.', 'Acessibilidade não é um acabamento posterior. Estrutura semântica, foco visível, labels e mensagens associadas aos campos precisam nascer com o componente. Preferências de contraste e redução de movimento devem respeitar o sistema e permanecer sob controle da pessoa.\n\nInterfaces de trabalho concentram tabelas, filtros e ações sensíveis. Por isso, estados não podem depender somente de cor e modais devem controlar o foco corretamente. Uma revisão com teclado e leitor de tela encontra problemas que ferramentas automáticas não conseguem explicar sozinhas.', 'Interface de painel com foco visível e contraste elevado', array['acessibilidade','wcag','design-system'], false, 6, 'Acessibilidade em produtos B2B', 'Práticas de acessibilidade para interfaces operacionais com tabelas, filtros e formulários.', 'produto', now() - interval '21 days'),
  ('article', 'atendimento-com-historico', 'Atendimento com histórico transforma suporte em aprendizado', 'Protocolos, estados e conversas estruturadas ajudam a equipe a resolver e melhorar o produto.', 'Um chamado precisa ter assunto, prioridade, responsável e histórico. Sem essas informações, a equipe repete perguntas e o cliente não sabe o que esperar. O protocolo organiza a conversa, mas o valor está na continuidade entre mensagens, anexos e mudanças de status.\n\nEncerramento e reabertura devem ser controlados e auditáveis. Categorias consistentes permitem identificar temas recorrentes sem expor detalhes pessoais. Quando suporte e produto compartilham evidências, problemas deixam de ser casos isolados e se tornam oportunidades de melhoria.', 'Linha do tempo de um atendimento com etapas resolvidas', array['atendimento','suporte','histórico'], false, 4, 'Atendimento com histórico e contexto', 'Organize chamados, protocolos e estados para melhorar resolução e aprendizado.', 'experiencia-do-cliente', now() - interval '14 days'),
  ('article', 'governanca-de-arquivos', 'Governança de arquivos além do botão de upload', 'Validação, propriedade e exclusão lógica tornam documentos úteis sem abrir novas brechas.', 'Upload é uma fronteira de segurança. O servidor deve validar tamanho, tipo declarado e assinatura real do arquivo, gerar nomes internos imprevisíveis e manter o armazenamento privado. A autorização precisa ser verificada novamente no download.\n\nProjetos profissionais também precisam de contexto: quem enviou, a qual cliente ou projeto o arquivo pertence e qual é seu estado. Exclusão lógica preserva rastreabilidade, enquanto políticas de retenção evitam acumulação indefinida. A experiência pode continuar simples sem esconder esses controles.', 'Arquivos protegidos organizados por projeto', array['arquivos','segurança','governança'], false, 5, 'Governança e segurança de arquivos', 'Como combinar upload seguro, propriedade, contexto e retenção de documentos.', 'seguranca', now() - interval '7 days')
) as seed(kind, slug, title, excerpt, body, cover_alt, tags, featured, reading_minutes, seo_title, seo_description, category_slug, published_at)
join public.content_categories category
  on category.organization_id is null
  and category.locale = 'pt-BR'
  and category.slug = seed.category_slug
on conflict (organization_id, locale, slug) do nothing;

create or replace function public.activate_demo_subscription(
  target_organization_id text,
  target_plan_code text,
  target_billing_cycle text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  selected_plan public.plans%rowtype;
  subscription_id text;
  amount_cents integer;
  subscription_status text;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not private.has_org_role(target_organization_id, array['owner', 'admin']) then
    raise exception 'billing permission required' using errcode = '42501';
  end if;

  if target_billing_cycle not in ('monthly', 'annual') then
    raise exception 'invalid billing cycle' using errcode = '22023';
  end if;

  select * into selected_plan
  from public.plans
  where code = target_plan_code and active = true;

  if not found then
    raise exception 'plan not found' using errcode = '22023';
  end if;

  amount_cents := case
    when target_billing_cycle = 'annual' then selected_plan.annual_price_cents
    else selected_plan.monthly_price_cents
  end;
  subscription_status := case when selected_plan.code = 'free' then 'active' else 'trialing' end;

  insert into public.subscriptions(
    organization_id, plan_code, billing_cycle, status, provider,
    current_period_start, current_period_end, cancel_at_period_end, updated_at
  )
  values (
    target_organization_id,
    selected_plan.code,
    target_billing_cycle,
    subscription_status,
    'demo',
    now(),
    case when target_billing_cycle = 'annual' then now() + interval '1 year' else now() + interval '1 month' end,
    false,
    now()
  )
  on conflict (organization_id) do update set
    plan_code = excluded.plan_code,
    billing_cycle = excluded.billing_cycle,
    status = excluded.status,
    provider = 'demo',
    provider_customer_id = null,
    provider_subscription_id = null,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = false,
    updated_at = now()
  returning id into subscription_id;

  update public.organizations
  set plan = selected_plan.code, updated_at = now()
  where id = target_organization_id;

  insert into public.billing_events(
    organization_id, subscription_id, type, amount_cents, currency, status, metadata
  ) values (
    target_organization_id,
    subscription_id,
    'subscription.demo_activated',
    amount_cents,
    selected_plan.currency,
    'simulated',
    jsonb_build_object('plan', selected_plan.code, 'cycle', target_billing_cycle)
  );

  insert into public.activities(
    organization_id, actor_user_id, type, title, detail, resource_type, resource_id
  ) values (
    target_organization_id,
    caller_id,
    'subscription.demo_activated',
    'Plano demonstrativo atualizado',
    selected_plan.name || ' · ' || case when target_billing_cycle = 'annual' then 'anual' else 'mensal' end,
    'subscription',
    subscription_id
  );

  insert into public.notifications(user_id, organization_id, category, title, body)
  values (
    caller_id,
    target_organization_id,
    'billing',
    'Plano demonstrativo ativado',
    'O plano ' || selected_plan.name || ' foi ativado em modo de demonstração. Nenhuma cobrança real foi realizada.'
  );

  return jsonb_build_object(
    'subscriptionId', subscription_id,
    'plan', selected_plan.code,
    'billingCycle', target_billing_cycle,
    'status', subscription_status,
    'amountCents', amount_cents,
    'mode', 'demo'
  );
end;
$$;

revoke all on function public.activate_demo_subscription(text, text, text) from public, anon;
grant execute on function public.activate_demo_subscription(text, text, text) to authenticated;

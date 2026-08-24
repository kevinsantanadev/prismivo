# Arquitetura Técnica

## 1. Estilo arquitetural

O Prismivo começa como um **monólito modular** em Next.js. A escolha reduz complexidade operacional inicial sem misturar domínios. Cada módulo possui contratos, validação, serviços e acesso a dados próprios. Filas, webhooks e processamentos assíncronos podem ser extraídos quando volume ou isolamento justificarem.

## 2. Stack de referência

- Next.js 16 com App Router;
- React 19 e TypeScript em modo estrito;
- Tailwind CSS 4 e design tokens próprios;
- Lucide para ícones vetoriais;
- PostgreSQL 17, Supabase Auth e Supabase Storage no ambiente independente;
- RLS em todas as tabelas públicas e políticas por usuário/organização;
- adaptadores D1 e identidade do Sites preservados somente durante a janela de transição;
- Zod para esquemas de entrada/saída;
- Object storage privado para arquivos;
- Stripe em modo teste e adaptador de demonstração;
- E-mail transacional com caixa local em desenvolvimento;
- Vitest, Testing Library e Playwright;
- GitHub Actions para lint, tipos, testes, build e migrações verificadas.
- PWA de escopo público, com manifesto, página offline e cache explicitamente separado das rotas autenticadas.

## 3. Organização por domínio

```text
app/                        # Rotas públicas, protegidas e APIs
├── api/
├── app/
├── cadastro/
├── entrar/
└── components/
domains/                    # Crescimento previsto por capacidade
│   ├── auth/
│   ├── organizations/
│   ├── clients/
│   ├── projects/
│   ├── approvals/
│   ├── files/
│   ├── support/
│   ├── content/
│   ├── billing/
│   ├── notifications/
│   └── audit/
db/                         # Compatibilidade D1 durante a transição
lib/supabase/               # Sessão SSR, dados, mutações e arquivos
lib/                        # Validação, segurança e regras de domínio
drizzle/                    # Migrações do ambiente Sites
supabase/migrations/        # PostgreSQL, índices, RLS e Storage
emails/                     # Templates quando ativados
tests/                      # Regras e fluxos automatizados
```

A estrutura permanece na raiz para manter compatibilidade direta com o ambiente de execução. O agrupamento por domínio será introduzido conforme cada módulo ganhar regras próprias.

## 4. Limites e responsabilidades

### Apresentação

- Componentes sem acesso direto ao banco;
- Server Components para leitura e composição;
- Client Components apenas quando há interação local real;
- Formulários tipados e mensagens localizadas.

### Aplicação

- Casos de uso explícitos;
- Regras de negócio independentes do transporte HTTP;
- Autorização antes de acessar ou alterar dados;
- Eventos de domínio para notificações e auditoria.

### Dados

- o Supabase concentra PostgreSQL, Auth e Storage;
- leitores e mutações ficam em módulos server-only por capacidade;
- toda consulta multi-tenant combina RLS com `organization_id` resolvido pela sessão;
- Índices acompanham filtros e ordenações reais;
- Migrações versionadas e revisadas antes do deploy.

### Integrações

- Adaptadores para pagamentos, e-mail, arquivos, analytics e monitoramento;
- Modo demonstrativo usa implementações locais determinísticas;
- Segredos ficam apenas no ambiente do servidor.

## 5. Multi-tenancy

O isolamento inicial utiliza banco compartilhado com `organization_id` obrigatório nas entidades pertencentes a clientes. A autorização verifica simultaneamente:

1. Sessão válida;
2. Participação ativa na organização;
3. Permissão para a ação;
4. Propriedade/escopo do recurso;
5. Limites do plano.

Nenhuma identidade, função, preço ou propriedade enviada pelo navegador é considerada confiável.

## 6. Autenticação e sessão

- Supabase Auth mantém credenciais e hashes fora das tabelas de produto;
- cadastro exige confirmação de e-mail e registra apenas metadados mínimos;
- login, logout, recuperação e redefinição usam mensagens seguras e rotas próprias;
- o Proxy atualiza cookies SSR e páginas/APIs privadas confirmam o usuário no servidor;
- o primeiro acesso exige onboarding e registra consentimento versionado;
- destinos pós-login aceitam somente caminhos relativos seguros;
- 2FA e painel de sessões estão previstos para o próximo ciclo de segurança.

## 7. API

- Rotas versionáveis sob `/api/v1` quando expostas externamente;
- Server Actions apenas para fluxos internos bem delimitados;
- Resposta padrão `{ data, error, meta }`;
- Paginação por cursor em feeds e por página em tabelas administrativas;
- Erros possuem código público estável e detalhes internos apenas nos logs;
- Idempotência em contato, checkout, webhooks e ações críticas.

## 8. Armazenamento de arquivos

- Bytes no object storage; metadados e autorização no banco relacional;
- Nome físico aleatório, sem confiar no nome original;
- Upload autenticado pelo servidor e armazenamento em chave opaca;
- Tipos e limites conferidos antes e após upload;
- Download privado exige sessão e propriedade;
- Imagens públicas otimizadas usam caminhos separados de arquivos privados.

## 9. Deploy

Ambientes independentes:

- `development`: banco local/branch de desenvolvimento, e-mails capturados e pagamento demo;
- `preview`: banco isolado, credenciais de teste e dados descartáveis;
- `production`: banco e bucket próprios, HTTPS, backups, monitoramento e segredos gerenciados.

O pipeline executa lint, verificação de tipos, testes, build e validação de migrações antes de promover uma versão.
As jornadas E2E rodam em Chromium e WebKit móvel contra um build de produção somente depois da validação estática e cobrem entrada gratuita, preferências transacionais, tema integral da barra lateral, proteção de rotas, responsividade e disponibilidade pública. `/api/health` fornece prontidão técnica sem dados sensíveis, enquanto `/status` comunica o estado de forma humana.

## 10. Decisões registradas

### ADR-001 — Monólito modular

Escolhido para entregar transações e evolução rápidas com baixo custo operacional. Serviços separados somente quando houver necessidade mensurável.

### ADR-002 — PostgreSQL + Supabase

Supabase foi escolhido para reunir PostgreSQL, autenticação e armazenamento privado com RLS nativo. A migração é versionada, a chave usada pelo navegador é publicável e as políticas do banco continuam sendo a fronteira de autorização mesmo quando uma rota da aplicação falha em filtrar um registro.

### ADR-003 — Adaptadores para integrações

Pagamentos, e-mail, arquivos e analytics não entram diretamente nas regras de negócio. O modo demonstrativo continua funcional sem credenciais privadas.

### ADR-004 — Segurança multi-tenant no servidor

Ocultar interface não é autorização. A camada de aplicação sempre verifica organização, papel, permissão e propriedade.

### ADR-005 — Supabase Auth com SSR

O Prismivo usa Supabase Auth para cadastro e sessão sem manter senhas nas tabelas da aplicação. Cookies são tratados no servidor com `@supabase/ssr`, e o acesso aos dados combina confirmação de identidade, participação e RLS.

O plano de transição, incluindo modelo de identidade, migração de dados, troca de DNS e critérios de segurança, está documentado em [`AUTH_HOSTING_MIGRATION.md`](AUTH_HOSTING_MIGRATION.md).

### ADR-006 — Arquivos privados no Supabase Storage

Os bytes ficam em bucket privado e os metadados autorizáveis permanecem no PostgreSQL. Upload, download e exclusão passam por rotas autenticadas, e as políticas do Storage restringem a chave física ao diretório da organização.

### ADR-007 — Vercel como execução independente

O build nativo do Next.js é executado na Vercel com ambientes separados e variáveis gerenciadas. A produção foi promovida depois dos testes automatizados e do smoke test, mantendo a hospedagem anterior como rollback até a propagação do domínio próprio.

### ADR-008 — PWA pública sem cache privado

O service worker melhora a resiliência somente do conteúdo público. Dashboard, autenticação, convites, APIs e a página de status nunca são interceptados ou armazenados, evitando que dados protegidos permaneçam em caches controlados pelo navegador.

### ADR-009 — Rate limiting persistente e fail-closed

Fluxos de autenticação consomem contadores no PostgreSQL por janelas fixas. A aplicação envia à RPC somente um hash SHA-256 derivado da identidade, origem e `RATE_LIMIT_PEPPER`; nenhum desses valores originais é persistido. A tabela privada não possui acesso direto para `anon` ou `authenticated`, tem RLS habilitada e é manipulada somente pela função transacional. Em produção, ausência do segredo ou falha do contador bloqueia a tentativa sensível em vez de liberar tráfego sem proteção.

### ADR-010 — Localização persistente com lista permitida

O idioma é limitado a PT-BR, inglês ou espanhol e persistido no dispositivo e em um cookie funcional `SameSite=Lax`, sem dados pessoais. Componentes interativos atualizam a experiência imediatamente, enquanto páginas renderizadas no servidor leem somente valores normalizados. Formulários enviam o idioma escolhido para que mensagens de validação continuem consistentes sem confiar em textos arbitrários do navegador.

# Prismivo

Plataforma SaaS B2B de **client operations** criada para profissionais e pequenas empresas de serviços centralizarem clientes, projetos, aprovações, arquivos, atendimento e cobranças.

> Status atual: Marco 19 em validação — toda a jornada pública e autenticada acompanha o idioma persistido em PT-BR, inglês e espanhol, incluindo equipe, assinatura, administração e onboarding.

## Visão geral

O Prismivo transforma a prestação de serviços em uma jornada clara e rastreável. A proposta não é ser apenas um gestor de tarefas: o produto conecta o trabalho interno à experiência do cliente, mantendo decisões, entregáveis, aprovações, mensagens e cobrança dentro do mesmo contexto.

### Público-alvo

- Profissionais independentes que atendem vários clientes;
- Agências, estúdios e consultorias de 2 a 30 pessoas;
- Empresas de arquitetura, tecnologia, BPO e serviços especializados;
- Equipes que ainda operam com planilhas, e-mails e mensagens desconectadas.

### Modelo de negócio

SaaS B2B freemium: o plano Inicial é gratuito e permite até três clientes e três projetos ativos; Studio e Escala representam os futuros planos pagos mensais ou anuais. Nesta versão, valores, depoimentos, empresas e resultados assinalados como demonstração são fictícios.

## O que já funciona

- Página inicial completa e responsiva;
- Identidade visual original **Spatial Graphite & Pearl**;
- Temas claro, escuro, preto e branco e preferência automática do sistema;
- Conteúdo público em português do Brasil, inglês e espanhol;
- Prisma tridimensional animado com implementação leve, responsiva e compatível com redução de movimento;
- Navegação móvel e por teclado;
- Seções de produto, soluções, seis casos demonstrativos, preços, conteúdo e FAQ;
- Alternância funcional entre planos mensais e anuais;
- Preferências de tema e idioma persistidas no dispositivo;
- Metadados básicos de SEO e compartilhamento;
- Respeito a `prefers-reduced-motion`;
- Botões “Começar grátis” conectados a uma rota real de cadastro;
- Fluxo completo de acesso traduzido, incluindo metadados, campos, ajuda, feedback de ações e preferências disponíveis na própria tela;
- Shell autenticado localizado, com navegação, títulos conhecidos, descrições, acessibilidade, notificações e ações de conta consistentes nos três idiomas;
- Jornada operacional principal localizada sem modificar nomes, descrições ou históricos criados pelos usuários;
- Carteiras de clientes e projetos localizadas, com pesquisa regional, datas, números, progresso, estados vazios e detalhes nos três idiomas;
- Decisões, documentos privados e entregáveis localizados, incluindo uploads, confirmações, versões e comentários sem alterar conteúdo empresarial;
- Cadastro, confirmação de e-mail, login, logout e recuperação de senha com Supabase Auth;
- Onboarding de empresa com validação cliente/servidor e aceite registrado;
- Aceites de Termos e Privacidade separados e vinculados às respectivas versões;
- PostgreSQL gerenciado no Supabase com migração versionada;
- Vinte e quatro tabelas de produto com Row Level Security e isolamento por usuário e organização;
- Bucket privado no Supabase Storage, limitado a 5 MB e com formatos permitidos;
- Dashboard protegido com clientes, projetos, histórico e notificações;
- Criação funcional de projetos com limite de plano validado no servidor;
- Carteira de clientes com cadastro, limite do plano e pesquisa local;
- Gestão de projetos com pesquisa, filtros e atualização persistente de progresso;
- Aprovações vinculadas a projetos, com aceite ou solicitação de ajustes e trilha de atividade;
- Central de notificações com leitura individual ou em lote;
- Configurações de perfil, empresa e idioma com permissões verificadas no servidor;
- Foto de perfil em bucket privado, com validação de tipo, tamanho e assinatura binária;
- Perfil profissional com biografia, cargo, telefone, localização e site;
- Personalização por cor de destaque e acabamento visual;
- Paletas acessíveis para protanopia, deuteranopia, tritanopia e acromatopsia, sem depender apenas de cor;
- Gestão de equipe com papéis `owner`, `admin`, `editor`, `support` e `viewer`;
- Convites protegidos por hash, uso único, vínculo ao e-mail e expiração em sete dias;
- Suspensão, remoção e alteração de papel com proteção do último proprietário;
- Matriz de permissões aplicada nas rotas de escrita e preparada para defesa em profundidade no RLS;
- Painel administrativo inicial com métricas reais e trilha de atividades da organização;
- Painel administrativo avançado com filtros por período e tipo, busca, paginação, gráfico de volume e exportação CSV protegida contra fórmulas;
- Central pública com oito artigos originais, pesquisa, categorias, filtros, páginas individuais, SEO e dados estruturados;
- Estúdio editorial autenticado para artigos, casos, serviços e ajuda, com rascunho, publicação e arquivamento;
- Planos persistidos no banco e assinatura demonstrativa com preço, permissão e organização validados pelo servidor;
- Histórico financeiro isolado por empresa, sem armazenar cartão nem executar cobrança real;
- Entregáveis vinculados a projetos, com histórico de versões numerado de forma transacional;
- Comentários rastreáveis por entregável e fluxo opcional de aprovação ao publicar uma versão;
- Anexos privados em atendimentos, com a mesma validação de tipo, tamanho, assinatura e propriedade dos arquivos do projeto;
- Rate limiting persistente nos fluxos de login, cadastro e recuperação, com identificadores combinados protegidos por hash;
- Cabeçalhos de segurança, CSP, proteção contra framing e cache privado nas rotas autenticadas;
- Health check sem dados sensíveis e página pública de disponibilidade dos serviços essenciais;
- Logs estruturados com remoção preventiva de campos sensíveis;
- PWA instalável com manifesto, atualização do service worker e experiência offline apenas para conteúdo público;
- Páginas personalizadas de indisponibilidade, manutenção, erro e rota não encontrada;
- Termos, Privacidade, Cookies, Cancelamento, Acessibilidade e Segurança em rotas indexáveis próprias;
- Páginas individuais de clientes e projetos com relacionamentos protegidos;
- Quadro de tarefas com prioridades, prazos e atualização persistente de status;
- Upload privado com validação de tamanho, extensão, MIME e assinatura;
- Download autenticado, exclusão lógica e vínculo de arquivos a projetos;
- Atendimento com protocolo, prioridade, mensagens, encerramento e reabertura;
- Quarenta e três testes unitários de validação, permissões, relatórios, conteúdo, cobrança, entregáveis, localização e segurança;
- Cinco jornadas E2E em Chromium para cadastro, preferências, proteção de rotas, responsividade e disponibilidade;
- Pipeline de CI com testes unitários, tipagem, lint, build e Playwright antes de cada integração à branch principal.
- Preview independente na Vercel com build nativo do Next.js, variáveis isoladas por ambiente e status `READY` validado;
- Execução E2E configurável contra ambiente local ou URL externa por `PLAYWRIGHT_BASE_URL`.

## Arquitetura planejada

| Camada | Tecnologia / decisão |
| --- | --- |
| Interface | Next.js 16, React 19, TypeScript, Tailwind CSS 4 e Lucide |
| Server-side | App Router, Route Handlers e serviços organizados por domínio |
| Dados | PostgreSQL gerenciado pelo Supabase, migrações SQL e RLS em todas as tabelas públicas |
| Autenticação | Supabase Auth com e-mail/senha, confirmação, recuperação, cookies SSR e proteção de rotas |
| Arquivos | Supabase Storage privado, políticas por organização e download autenticado |
| Pagamentos | Adaptador para Stripe em modo teste/demonstração |
| E-mails | Adaptador transacional com caixa de desenvolvimento local |
| Testes | Vitest, Testing Library e Playwright |
| Operação | CI com GitHub Actions, logs estruturados, health check e monitoramento |

As decisões detalhadas estão em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Estrutura atual

```text
app/
├── api/                    # Operações autenticadas e validadas no servidor
├── app/                    # Dashboard e módulos operacionais autenticados
├── cadastro/ e entrar/     # Portas públicas de acesso
├── legal/                  # Documentos legais versionados e interligados
├── layout.tsx              # Metadados e shell global
├── prismivo-home.tsx       # Experiência pública
└── globals.css             # Design system e responsividade
db/
├── schema.ts               # Compatibilidade temporária da camada de dados legada
└── index.ts                # Adaptador legado do banco atual
lib/
├── supabase/               # Clientes SSR, dados, mutações, onboarding e arquivos
└── ...                     # Respostas de API, validação e regras de domínio
drizzle/                    # Migração SQL da camada de compatibilidade
supabase/migrations/        # Schema PostgreSQL, índices, RLS e Storage
docs/
├── PRODUCT.md              # Estratégia e escopo
├── ARCHITECTURE.md         # Arquitetura e decisões técnicas
├── DATABASE.md             # Entidades e relacionamentos
├── PERMISSIONS.md          # Papéis e matriz RBAC
├── API.md                  # Contratos principais da API
├── SECURITY.md             # Modelo de ameaças e controles
├── AUTH_HOSTING_MIGRATION.md # Migração segura para identidade e hospedagem independentes
└── DEPLOYMENT_CHECKLIST.md # Preparação para produção
```

## Requisitos

- Node.js `>=22.13.0 <23`;
- npm compatível com o lockfile;
- Git;
- Projeto Supabase para testar os fluxos autenticados completos.

## Instalação local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Acesse o endereço exibido no terminal. As páginas públicas funcionam sem credenciais. Para cadastro e área autenticada, preencha as duas variáveis públicas do Supabase documentadas no arquivo de exemplo.

## Scripts

```bash
npm run dev       # Ambiente local
npm run lint      # Qualidade estática
npm run typecheck # Verificação estrita de tipos
npm run build     # Build de produção validado
npm run build:vercel # Build nativo para hospedagem independente
npm test          # Testes unitários, build e verificação do artefato
npm run test:unit # Testes rápidos de regras e validação
npm run test:e2e  # Jornadas públicas em Chromium
npm run db:generate # Gera migrações a partir do schema Drizzle
```

Para executar as jornadas contra um preview já publicado, defina `PLAYWRIGHT_BASE_URL` com a URL autorizada do ambiente. Nenhum servidor local será iniciado nesse modo.

## Variáveis de ambiente

Use apenas `.env.local` ou o gerenciador seguro do provedor. O arquivo [`.env.example`](.env.example) documenta as chaves esperadas sem conter segredos.

## Acesso e conteúdo demonstrativo

Cada pessoa cria a própria conta e confirma o e-mail. No primeiro acesso, o onboarding cria uma organização isolada e dados fictícios suficientes para explorar clientes, projetos, aprovações, tarefas, arquivos, notificações e atendimento. Nenhuma senha demonstrativa é publicada.

## Documentação complementar

- [Estratégia do produto](docs/PRODUCT.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Banco de dados](docs/DATABASE.md)
- [Papéis e permissões](docs/PERMISSIONS.md)
- [API](docs/API.md)
- [Segurança](docs/SECURITY.md)
- [Migração de autenticação e hospedagem](docs/AUTH_HOSTING_MIGRATION.md)
- [Checklist de publicação](docs/DEPLOYMENT_CHECKLIST.md)

## Próximos marcos

1. Estender a localização aos módulos de atendimento, conteúdo, equipe, assinatura, administração e onboarding;
2. Configurar callbacks oficiais, remetente transacional e validar autenticação/dados ponta a ponta;
3. Preparar produção, rollback, backup e monitoramento antes da troca de DNS.

## Autoria e licença

Copyright © 2026 **Kevin Santana dos Reis**. Todos os direitos reservados.

O projeto é público para avaliação profissional, demonstração técnica e estudo pessoal. Ele **não é open source** e não autoriza cópia, redistribuição, publicação, comercialização ou apresentação como trabalho próprio. Consulte [LICENSE.md](LICENSE.md).

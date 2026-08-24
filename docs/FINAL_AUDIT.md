# Auditoria de Qualidade — Marco 22

Revisão executada no Marco 22 para consolidar personalização da navegação, tema integral da barra lateral, preferências transacionais, consistência visual, responsividade, segurança multiempresa e operação antes de cada promoção.

## Evidências automatizadas

| Verificação | Resultado |
| --- | --- |
| Testes unitários e de componentes | 72 cenários aprovados |
| Jornadas E2E | 108 execuções em desktop, Android e iOS |
| TypeScript | Sem erros |
| ESLint | Sem erros |
| Build Next.js | Compilação e geração de rotas aprovadas |
| Dependências | `npm audit` sem vulnerabilidades conhecidas |
| PostgreSQL | 24/24 tabelas públicas com RLS |
| Políticas | 73 políticas públicas ativas |
| Chaves estrangeiras | Nenhuma sem índice de cobertura |
| Isolamento multiempresa | Dois contextos autenticados, sem leitura ou escrita cruzada |
| Logs recentes | 100 eventos de API e 100 de Auth sem respostas HTTP de erro; PostgreSQL sem evento severo |

As jornadas Playwright também são executadas pelo GitHub Actions depois dos bloqueios estáticos. A suíte integral roda em Chrome desktop, Galaxy S24/Chromium e iPhone 16/WebKit; uma suíte móvel especializada acrescenta Galaxy S9+, Pixel 8 em paisagem, iPhone SE e iPhone 16 em paisagem. Ela verifica cadastro, persistência e hidratação de preferências, tema adaptável da barra lateral, proteção das rotas privadas, health check, status público, contraste automatizável, orientação, menus, formulários, áreas de toque, ausência de controles cortados e ausência de rolagem horizontal em 320, 360, 390, 412 e 430 px.

As superfícies autenticadas são exercitadas com uma composição representativa que reutiliza o CSS real do produto, sem criar rota pública, credencial fixa ou desvio de autenticação. A composição inclui barra superior com nomes extensos, navegação inferior, métricas, tabelas contidas, tarefas, clientes, configurações e atendimento.

## Autorização e isolamento

- A identidade vem da sessão Supabase validada no servidor.
- `organization_id`, usuário, papel, preço e propriedade nunca são aceitos como autoridade do navegador.
- As tabelas públicas combinam RLS com filtros explícitos da organização.
- RPCs elevadas validam `auth.uid()`, participação, papel e vínculo do recurso internamente.
- Convites armazenam somente hash do token, expiram e são aceitos uma vez pelo e-mail correspondente.
- O último proprietário ativo de uma organização não pode ser removido ou suspenso.

## Dados, arquivos e privacidade

- O bucket é privado e downloads exigem sessão e escopo da organização.
- Uploads possuem limite, allowlist de formato, comparação de MIME e assinatura binária.
- Chaves físicas são opacas e arquivos parciais são removidos quando a persistência falha.
- Logs descartam campos associados a credenciais e dados sensíveis.
- Consentimentos opcionais não começam marcados e preferências funcionais são localizadas.

## Navegação e acessibilidade

- HTML semântico, links de salto, hierarquia de títulos e foco visível.
- Formulários com labels, erros associados e estados de carregamento.
- Controles de tema claro, escuro, preto e branco e preferência do sistema.
- Barra lateral adaptável ao tema, com escolhas explícitas clara, escura e baseada na marca.
- Densidade, largura do conteúdo, cantos, escala de texto e movimento configuráveis.
- Alterações de tema e idioma permanecem em rascunho até a confirmação em “Salvar”.
- A preferência salva é aplicada a toda a área privada, incluindo a barra lateral.
- Preferências da conta vencem valores antigos do dispositivo sem corrida durante a hidratação.
- Quatro destinos principais podem ser escolhidos e ordenados para a barra lateral e a navegação móvel; o menu completo permanece acessível por teclado.
- Perfis de cor para protanopia, deuteranopia, tritanopia e acromatopsia.
- Redução de movimento respeitada e informações não dependem apenas de cor.
- Controles de formulário preservam 16 px e áreas de toque mínimas em celulares para evitar zoom involuntário.
- Celulares em paisagem ativam a composição móvel quando possuem ponteiro por toque e altura reduzida.
- Títulos extensos da empresa ou do projeto são contidos sem empurrar as ações da barra superior para fora da tela.

## Riscos residuais aceitos

- O advisor do banco sinaliza RPCs autenticadas `security definer` por precaução. Cada função foi revisada e contém autorização interna necessária à transação multi-tabela.
- Índices ainda sem uso não foram removidos, pois o banco não possui tráfego real suficiente para orientar essa decisão.
- A proteção contra senhas já vazadas ainda precisa ser habilitada na configuração do Supabase Auth.
- Cobrança permanece demonstrativa; nenhuma funcionalidade paga será liberada por retorno de navegador.
- Backup restaurado e monitoramento com alertas ainda precisam ser confirmados antes da abertura comercial.

## Critério de promoção

Cada promoção exige testes, tipagem, lint, build, jornadas E2E, advisors do banco e smoke test públicos aprovados. A abertura comercial continua condicionada ao teste de restauração de backup, monitoramento e revisão jurídica.

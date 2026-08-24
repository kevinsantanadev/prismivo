# Auditoria de Qualidade — Marco 21

Revisão executada no Marco 21 para consolidar preferências transacionais, consistência visual, responsividade, segurança multiempresa e operação antes de cada promoção.

## Evidências automatizadas

| Verificação | Resultado |
| --- | --- |
| Testes unitários e de componentes | 62 cenários aprovados |
| TypeScript | Sem erros |
| ESLint | Sem erros |
| Build Next.js | Compilação e geração de rotas aprovadas |
| Dependências | `npm audit` sem vulnerabilidades conhecidas |
| PostgreSQL | 24/24 tabelas públicas com RLS |
| Políticas | 73 políticas públicas ativas |
| Chaves estrangeiras | Nenhuma sem índice de cobertura |
| Isolamento multiempresa | Dois contextos autenticados, sem leitura ou escrita cruzada |
| Logs recentes | 100 eventos de API e 100 de Auth sem respostas HTTP de erro; PostgreSQL sem evento severo |

As jornadas Playwright também são executadas pelo GitHub Actions em Chromium e WebKit móvel após os bloqueios estáticos. Elas verificam cadastro, persistência de preferências, proteção das rotas privadas, health check, status público, acessibilidade automatizável e ausência de rolagem horizontal em 320, 360, 390, 412 e 430 px.

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
- Alterações de tema e idioma permanecem em rascunho até a confirmação em “Salvar”.
- A preferência salva é aplicada a toda a área privada, incluindo a barra lateral.
- Navegação móvel fixa com quatro destinos principais e menu completo acessível por teclado.
- Perfis de cor para protanopia, deuteranopia, tritanopia e acromatopsia.
- Redução de movimento respeitada e informações não dependem apenas de cor.
- Controles de formulário preservam 16 px e áreas de toque mínimas em celulares para evitar zoom involuntário.

## Riscos residuais aceitos

- O advisor do banco sinaliza RPCs autenticadas `security definer` por precaução. Cada função foi revisada e contém autorização interna necessária à transação multi-tabela.
- Índices ainda sem uso não foram removidos, pois o banco não possui tráfego real suficiente para orientar essa decisão.
- A proteção contra senhas já vazadas ainda precisa ser habilitada na configuração do Supabase Auth.
- Cobrança permanece demonstrativa; nenhuma funcionalidade paga será liberada por retorno de navegador.
- Backup restaurado e monitoramento com alertas ainda precisam ser confirmados antes da abertura comercial.

## Critério de promoção

Cada promoção exige testes, tipagem, lint, build, jornadas E2E, advisors do banco e smoke test públicos aprovados. A abertura comercial continua condicionada ao teste de restauração de backup, monitoramento e revisão jurídica.

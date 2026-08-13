# Auditoria Final Pré-Produção

Revisão executada no Marco 20 para consolidar segurança, qualidade, acessibilidade, desempenho e operação antes da promoção do ambiente definitivo.

## Evidências automatizadas

| Verificação | Resultado |
| --- | --- |
| Testes unitários | 45 cenários aprovados |
| TypeScript | Sem erros |
| ESLint | Sem erros |
| Build Next.js | Compilação e geração de rotas aprovadas |
| Dependências | `npm audit` sem vulnerabilidades conhecidas |
| PostgreSQL | 24/24 tabelas públicas com RLS |
| Políticas | 73 políticas públicas ativas |
| Chaves estrangeiras | Nenhuma sem índice de cobertura |

As jornadas Playwright também são executadas pelo GitHub Actions em Chromium após os bloqueios estáticos. Elas verificam cadastro real, persistência de tema e idioma, proteção das rotas privadas, health check, status público e ausência de rolagem horizontal em viewport móvel.

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
- Perfis de cor para protanopia, deuteranopia, tritanopia e acromatopsia.
- Redução de movimento respeitada e informações não dependem apenas de cor.
- Experiência responsiva verificada em 390 px e desktop pelas jornadas E2E.

## Riscos residuais aceitos

- O advisor do banco sinaliza RPCs autenticadas `security definer` por precaução. Cada função foi revisada e contém autorização interna necessária à transação multi-tabela.
- Índices ainda sem uso não foram removidos, pois o banco não possui tráfego real suficiente para orientar essa decisão.
- Cobrança permanece demonstrativa; nenhuma funcionalidade paga será liberada por retorno de navegador.
- E-mail transacional, backup restaurado e monitoramento precisam ser confirmados no ambiente definitivo antes da abertura comercial.

## Critério de promoção

Produção somente pode ser promovida quando variáveis server-only, callbacks do Supabase, remetente, domínio, HTTPS, recuperação de senha, backup e rollback estiverem validados no provedor definitivo.

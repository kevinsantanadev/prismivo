# Modelo de Segurança

## Objetivos

- Confidencialidade entre organizações;
- Integridade de decisões, aprovações e pagamentos;
- Disponibilidade adequada ao produto;
- Rastreabilidade administrativa sem excesso de dados;
- Privacidade por padrão.

## Ameaças e controles

| Ameaça | Controle principal |
| --- | --- |
| Injeção | ORM/prepared statements, validação tipada e consultas parametrizadas |
| XSS | Escape padrão, sanitização de HTML rico e CSP |
| CSRF | Cookies apropriados, validação de origem e tokens quando necessário |
| IDOR/BOLA | Escopo por organização, propriedade e permissão no servidor |
| Enumeração de contas | Respostas uniformes e limitação de tentativas |
| Força bruta | Rate limit progressivo, eventos de segurança e bloqueio temporário |
| Roubo de sessão | Cookies seguros, rotação, revogação e expiração |
| Upload malicioso | Allowlist de MIME/extensão, limite, renomeação e verificação pós-upload |
| Manipulação de preço | Catálogo e cálculo somente no servidor |
| Webhook forjado | Assinatura, timestamp, idempotência e origem configurada |
| Vazamento em logs | Redação de segredos, tokens, senhas, cartões e conteúdo sensível |
| Dependência vulnerável | Lockfile, auditoria, atualização controlada e CI |
| Redirecionamento aberto | Destinos relativos ou allowlist explícita |

## Cabeçalhos implementados

- `Content-Security-Policy`;
- `Strict-Transport-Security` em produção;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `Permissions-Policy` mínima;
- proteção contra framing por CSP `frame-ancestors`;
- cache privado ou `no-store` em rotas sensíveis.

## Sessões e credenciais

- Supabase Auth processa e armazena hashes de senha fora das tabelas de produto;
- senhas nunca entram em logs, analytics, auditoria ou banco da aplicação;
- tokens de confirmação e recuperação são gerenciados pelo provedor, com expiração;
- cookies SSR são atualizados pelo Proxy e a identidade é revalidada no servidor;
- Sessões ativas podem ser revogadas individualmente ou em conjunto;
- Mudanças de e-mail, senha e 2FA geram notificação de segurança;
- Segredos são rotacionáveis e nunca publicados no repositório.

## Controles implementados neste marco

- RLS habilitada em todas as tabelas públicas do Prismivo;
- políticas por usuário e por participação ativa na organização;
- bucket privado com políticas equivalentes e limite de 5 MB;
- chave publicável no navegador protegida por RLS e `service_role` restrita ao processo servidor-servidor de rate limiting;
- respostas uniformes na recuperação para reduzir enumeração de contas;
- proteção contra redirecionamento aberto nos retornos de autenticação;
- verificação de identidade em cada API de escrita;
- validação de origem para reduzir CSRF;
- exigência de JSON e limite de corpo no onboarding;
- validação tipada com mensagens de campo;
- escopo de organização resolvido exclusivamente no servidor;
- limite do plano gratuito validado no servidor;
- consultas parametrizadas pelo cliente PostgREST;
- erros públicos genéricos e logs sem payload, e-mail ou segredo;
- consentimento versionado e dados demonstrativos identificados.
- tarefas, arquivos e chamados sempre filtrados pela organização;
- uploads limitados a 5 MB, com allowlist de extensão/MIME e assinatura binária;
- chaves físicas opacas, bucket privado e downloads autenticados com `no-store` e `nosniff`;
- exclusão restrita ao proprietário da empresa ou autor do upload;
- protocolos aleatórios, mensagens validadas e transições de atendimento controladas.
- políticas de inserção provam que projeto, entregável, versão, arquivo, aprovação e chamado pertencem à mesma organização;
- numeração de versões ocorre em RPC transacional com bloqueio de linha, identidade, papel e propriedade do arquivo validados internamente;
- anexos de atendimento reutilizam o armazenamento privado e são removidos se o vínculo persistente falhar.
- login, cadastro e recuperação possuem limites persistentes por janela, usando combinação de identidade e origem protegida por hash com segredo do ambiente;
- a RPC do limitador revoga execução de `anon` e `authenticated`; somente o cliente server-only com segredo de serviço pode consumir contadores;
- janelas expiradas são removidas automaticamente e a aplicação bloqueia de forma segura se o segredo obrigatório estiver ausente em produção;
- CSP, HSTS, `nosniff`, bloqueio de framing, política de referenciador e permissões mínimas são enviados globalmente;
- a exceção `unsafe-eval` existe somente no servidor de desenvolvimento para o runtime de depuração do framework e não integra o build de produção;
- páginas privadas e APIs recebem diretivas de não indexação, e a área autenticada usa cache privado `no-store`;
- logs operacionais usam JSON estruturado e descartam preventivamente chaves associadas a senha, token, cookie, segredo, autorização ou e-mail;
- o health check usa resposta mínima, sem conexão, credencial, ambiente ou stack trace;
- o service worker ignora autenticação, APIs, dashboard, convites, status e demais rotas sensíveis, evitando persistência local de dados privados.

## Resultado da auditoria pré-produção

- 24 de 24 tabelas públicas com RLS habilitada;
- 73 políticas públicas de acesso por usuário, organização e papel;
- nenhuma chave estrangeira sem índice de cobertura após o Marco 20;
- chave de serviço ausente do bundle público e sem prefixo `NEXT_PUBLIC`;
- `npm audit` sem vulnerabilidades conhecidas após atualização compatível das dependências;
- nove avisos do advisor para RPCs `security definer` autenticadas foram revisados individualmente: todas validam `auth.uid()`, organização, papel e propriedade dentro da função antes de acessar dados;
- `organization_invitations` permanece sem política direta por intenção: privilégios de tabela foram revogados e o acesso acontece somente pelas RPCs revisadas.

## Privacidade

- Consentimentos opcionais começam desmarcados;
- Analytics só inicia conforme preferência e base aplicável;
- Exportação é autenticada e entregue de modo seguro;
- Exclusão usa período de segurança e anonimização quando retenção legal exigir;
- Dados coletados possuem finalidade documentada;
- Ambientes de demonstração usam somente dados fictícios.

## Auditoria

Registrar:

- ator, organização, ação, recurso, resultado e horário;
- mudanças de papel, suspensão, publicação, exclusão, reembolso e configuração;
- contexto técnico mínimo (request ID e origem resumida).

Nunca registrar:

- senha ou hash de senha;
- token, chave, segredo ou cookie;
- cartão completo ou código de segurança;
- corpo integral de documentos e mensagens privadas.

## Processo de revisão

1. Threat modeling por fluxo;
2. Testes negativos de autorização;
3. Revisão de dependências;
4. Verificação de headers e cookies;
5. Testes de upload e rate limit;
6. Auditoria de logs;
7. Checklist OWASP antes da produção.

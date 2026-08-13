# Checklist de Publicação

## Aplicação

- [x] Lint, tipos, testes e build local aprovados;
- [x] Metadados, sitemap e robots revisados;
- [x] Rotas privadas usam `noindex` e não aparecem no sitemap;
- [x] Página 404, erro, manutenção, status e offline implementadas;
- [x] Tema, idioma, teclado, viewport móvel e redução de movimento revisados;
- [x] Nenhum botão principal sem ação funcional;
- [x] Conteúdo demonstrativo identificado corretamente.

## Banco

- [x] Projeto Supabase dedicado ao Prismivo;
- [x] Migração PostgreSQL revisada e aplicada;
- [ ] Backup automático e restauração testada;
- [ ] Seed de demonstração bloqueado em produção;
- [x] Índices e consultas críticas analisados;
- [ ] Retenção e exclusão configuradas.

## Autenticação e segurança

- [ ] Segredo de autenticação forte e exclusivo;
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada somente no ambiente do servidor;
- [ ] Cookies `Secure`, `HttpOnly` e `SameSite` validados;
- [ ] Verificação e recuperação de e-mail funcionando;
- [x] Rate limit persistente aplicado aos fluxos sensíveis;
- [x] RLS e permissões verificadas no servidor;
- [x] CSP e demais headers validados no build local de produção;
- [x] Nenhum segredo no repositório ou bundle público;
- [x] Bucket privado e políticas de upload/download configurados;
- [x] Logs estruturados descartam campos sensíveis conhecidos.

## Integrações

- [ ] Domínios e URLs de callback oficiais;
- [ ] E-mail remetente verificado;
- [ ] Bucket privado e CORS mínimo;
- [ ] Pagamentos em modo produção somente após revisão;
- [ ] Webhooks assinados e idempotentes;
- [ ] Analytics condicionado às preferências de cookies;
- [ ] Monitoramento e alertas configurados.

## Operação

- [x] Preview independente na Vercel compilado e validado em estado `READY`;
- [x] Variáveis do Supabase e segredo de rate limit isolados no ambiente de preview;
- [ ] HTTPS e redirecionamento para domínio principal;
- [x] Health check e página pública de status disponíveis;
- [ ] Ambiente de teste e produção separados;
- [ ] Plano de rollback documentado;
- [ ] Responsáveis por incidente definidos;
- [ ] Política de backup e restauração documentada;
- [ ] Páginas legais revisadas por profissional qualificado;
- [ ] Aviso de direitos autorais visível.

## Configurações externas pendentes do proprietário

- Preservar o domínio ativo `prismivo.kevinsantanadev.com.br` e alterar o DNS apenas após validação integral do preview da Vercel;
- Cadastrar no Supabase as URLs de callback do preview e do domínio definitivo;
- Replicar as variáveis do Supabase no ambiente de produção somente após a validação dos callbacks;
- Gerar um `RATE_LIMIT_PEPPER` exclusivo para produção, separado do valor usado no preview;
- Configurar `SUPABASE_SERVICE_ROLE_KEY` diretamente no cofre da Vercel, somente para servidor e sem expor o valor em logs ou mensagens;
- PostgreSQL e bucket privado do Prismivo já configurados no Supabase;
- Provedor de e-mail e remetente;
- Revisar retenção e restauração do bucket privado do Supabase antes da abertura comercial;
- Conta de pagamentos, quando houver cobrança real;
- Monitoramento e analytics;
- Endereços de suporte e dados empresariais legais.

# Checklist de Publicação

## Aplicação

- [x] Lint, tipos, testes e builds Sites/Vercel aprovados;
- [ ] Metadados, sitemap e robots revisados;
- [ ] Rotas privadas usam `noindex` e não aparecem no sitemap;
- [ ] Página 404, 500, manutenção e offline verificadas;
- [ ] Tema, idioma, teclado e redução de movimento testados;
- [ ] Nenhum botão principal sem ação funcional;
- [ ] Conteúdo demonstrativo identificado corretamente.

## Banco

- [x] Projeto Supabase dedicado ao Prismivo;
- [x] Migração PostgreSQL revisada e aplicada;
- [ ] Backup automático e restauração testada;
- [ ] Seed de demonstração bloqueado em produção;
- [ ] Índices e consultas críticas analisados;
- [ ] Retenção e exclusão configuradas.

## Autenticação e segurança

- [ ] Segredo de autenticação forte e exclusivo;
- [ ] Cookies `Secure`, `HttpOnly` e `SameSite` validados;
- [ ] Verificação e recuperação de e-mail funcionando;
- [ ] Rate limit e bloqueio temporário funcionando;
- [x] RLS e permissões verificadas no servidor;
- [ ] CSP e demais headers ativos;
- [x] Nenhum segredo no repositório ou bundle público;
- [x] Bucket privado e políticas de upload/download configurados;
- [ ] Logs sem dados sensíveis.

## Integrações

- [ ] Domínios e URLs de callback oficiais;
- [ ] E-mail remetente verificado;
- [ ] Bucket privado e CORS mínimo;
- [ ] Pagamentos em modo produção somente após revisão;
- [ ] Webhooks assinados e idempotentes;
- [ ] Analytics condicionado às preferências de cookies;
- [ ] Monitoramento e alertas configurados.

## Operação

- [ ] HTTPS e redirecionamento para domínio principal;
- [ ] Health check disponível;
- [ ] Ambiente de teste e produção separados;
- [ ] Plano de rollback documentado;
- [ ] Responsáveis por incidente definidos;
- [ ] Política de backup e restauração documentada;
- [ ] Páginas legais revisadas por profissional qualificado;
- [ ] Aviso de direitos autorais visível.

## Configurações externas pendentes do proprietário

- Preservar o domínio ativo `prismivo.kevinsantanadev.com.br` e alterar o DNS apenas após validação integral do preview da Vercel;
- Cadastrar no Supabase as URLs de callback do preview e do domínio definitivo;
- Configurar as variáveis públicas do Supabase na Vercel;
- PostgreSQL e bucket privado do Prismivo já configurados no Supabase;
- Provedor de e-mail e remetente;
- Bucket privado R2 já integrado; revisar retenção e restauração antes da abertura pública;
- Conta de pagamentos, quando houver cobrança real;
- Monitoramento e analytics;
- Endereços de suporte e dados empresariais legais.

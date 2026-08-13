# Runbook de Produção

Este documento organiza a promoção do Prismivo para o ambiente definitivo sem interromper o domínio público existente. Segredos nunca devem ser copiados para o repositório, mensagens ou logs.

## 1. Pré-condições

- branch `main` aprovada pelo pipeline de qualidade;
- migrações aplicadas somente ao projeto Supabase dedicado ao Prismivo;
- backup recente e procedimento de restauração confirmado;
- preview da Vercel em estado `READY`;
- chaves públicas, chave server-only e segredo de rate limiting configurados no cofre do projeto;
- callbacks de autenticação autorizados para preview e domínio oficial;
- remetente e fluxo de confirmação/recuperação testados;
- domínio antigo mantido como rollback até o encerramento da validação.

## 2. Variáveis do ambiente definitivo

| Variável | Escopo | Observação |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | navegador e servidor | `https://prismivo.kevinsantanadev.com.br` |
| `NEXT_PUBLIC_SUPABASE_URL` | navegador e servidor | URL do projeto exclusivo do Prismivo |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | navegador e servidor | chave publicável ativa; acesso continua protegido por RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | somente servidor | usada pelo rate limiting; nunca prefixar com `NEXT_PUBLIC_` |
| `SUPABASE_STORAGE_BUCKET` | servidor | bucket privado `prismivo-files` |
| `RATE_LIMIT_PEPPER` | somente servidor | segredo aleatório exclusivo de produção |

Antes do deploy, execute `npm run verify:production-env` no ambiente que contém essas variáveis. O script valida presença e formato sem imprimir valores.

## 3. Autenticação

No projeto Supabase do Prismivo:

1. definir a URL oficial do site;
2. autorizar as URLs de callback do preview e de `https://prismivo.kevinsantanadev.com.br`;
3. confirmar que cadastro exige verificação de e-mail;
4. testar cadastro, confirmação, login, recuperação, redefinição e logout;
5. confirmar que mensagens não revelam se determinado e-mail existe.

## 4. Publicação sem indisponibilidade

1. gerar um preview da mesma revisão que será promovida;
2. executar a suíte automatizada e a revisão visual no preview;
3. conferir `/api/health`, logs, autenticação, RLS e upload privado;
4. promover a revisão aprovada para produção;
5. adicionar o domínio ao projeto da Vercel e copiar exatamente os registros DNS exibidos pelo painel;
6. alterar somente os registros do Prismivo no provedor DNS;
7. aguardar HTTPS válido e executar `npm run smoke:production -- https://prismivo.kevinsantanadev.com.br`;
8. monitorar erros e operações críticas antes de remover o ambiente anterior.

Não use valores DNS memorizados: a Vercel pode atribuir registros específicos ao projeto. Os valores mostrados na tela de configuração do domínio são a fonte correta.

## 5. Validação posterior

- página inicial, cadastro, login, status, sitemap e documentos legais respondem por HTTPS;
- health check retorna banco `ready` sem detalhes internos;
- nenhum conteúdo contém rotas ou marcas do provedor anterior;
- usuário comum não acessa administração;
- organizações diferentes não enxergam dados umas das outras;
- uploads privados exigem sessão e escopo correto;
- tema, idioma, daltonismo e redução de movimento persistem;
- layout não cria rolagem horizontal em celular;
- logs não contêm tokens, senhas ou dados pessoais completos.

## 6. Rollback

Se uma falha crítica surgir após a troca:

1. interromper novos cadastros apenas se a integridade dos dados estiver em risco;
2. restaurar o apontamento DNS anterior ou promover o último deployment saudável;
3. preservar banco e arquivos; não reverter migrações destrutivamente;
4. registrar o incidente sem dados sensíveis;
5. corrigir em preview, repetir os testes e somente então promover novamente.

O projeto `ps-agenda` não faz parte deste runbook e não deve ser acessado ou alterado durante a operação do Prismivo.

# Migração de Autenticação e Hospedagem

## Objetivo

Retirar a dependência do gateway de identidade e do formato de hospedagem atuais sem perder contas, organizações, projetos, arquivos ou histórico. O domínio público continuará sendo `prismivo.kevinsantanadev.com.br`.

## Estado atual confirmado

- Vercel foi escolhida como ambiente independente de execução do Next.js;
- Supabase foi escolhido para PostgreSQL, autenticação e armazenamento privado;
- o schema PostgreSQL está aplicado por migração versionada;
- todas as treze tabelas públicas possuem RLS e políticas por usuário ou organização;
- cadastro, confirmação de e-mail, login, logout, recuperação e troca de senha estão implementados;
- as APIs, páginas protegidas e arquivos usam a sessão do Supabase no servidor;
- os adaptadores do ambiente anterior permanecem temporariamente para permitir uma transição sem indisponibilidade.

## Arquitetura-alvo independente

| Capacidade | Requisito mínimo |
| --- | --- |
| Hospedagem | Next.js compatível, HTTPS, domínio próprio, logs, rollback e ambientes separados |
| Banco | PostgreSQL gerenciado, backup automático, migrações versionadas e conexão protegida |
| Autenticação | E-mail e senha, verificação, recuperação, sessões revogáveis, OAuth opcional e preparação para 2FA |
| Arquivos | Armazenamento privado, URLs temporárias, validação no servidor e política de retenção |
| E-mail | Remetente verificado, templates transacionais e caixa de desenvolvimento |
| Observabilidade | Erros, métricas, health check e alertas sem conteúdo sensível |

Os adaptadores do Supabase ficam concentrados em `lib/supabase`, enquanto validações e regras de domínio permanecem reutilizáveis. Não existe chave administrativa no navegador nem no repositório.

## Modelo de identidade implementado e evoluções

- `auth.users`: identidade, hash de senha e estado de confirmação mantidos pelo Supabase Auth;
- `profiles`: perfil mínimo ligado ao identificador autenticado;
- cookies SSR: sessão atualizada pelo Proxy do Next.js e validada novamente no servidor;
- `consents`: aceite separado e versionado de Termos e Privacidade.

Senhas nunca entram nas tabelas de produto, logs, analytics ou auditoria. Gestão visual de sessões, 2FA e eventos avançados de segurança permanecem como evolução antes da abertura comercial.

## Etapas sem interrupção

1. Aplicar schema, RLS e bucket privado no Supabase. **Concluído.**
2. Implementar adaptadores, autenticação e variáveis sem publicar segredos. **Concluído.**
3. Validar lint, tipos, testes e builds para os dois ambientes. **Concluído.**
4. Publicar e validar um preview independente na Vercel. **Concluído em 11 de agosto de 2026.**
5. Configurar URLs de autenticação e remetente transacional no domínio oficial.
6. Testar cadastro, confirmação, recuperação, permissões, uploads e exclusão ponta a ponta.
7. Trocar o CNAME somente depois da validação integral, mantendo o ambiente anterior como rollback.
8. Confirmar HTTPS, logs, integridade e operação antes de encerrar o ambiente anterior.

O preview independente foi compilado pelo projeto Vercel do Prismivo, chegou ao estado `READY` e carregou a experiência pública, cadastro, preferências persistentes e rotas protegidas. As variáveis públicas do Supabase e o segredo de rate limiting foram configurados somente no ambiente de preview. A publicação definitiva, callbacks oficiais e DNS permanecem separados desta validação.

## Critérios obrigatórios antes da troca

- nenhuma credencial no repositório ou bundle público;
- respostas uniformes para login e recuperação;
- cookies `Secure`, `HttpOnly` e `SameSite` revisados;
- rate limiting e bloqueio temporário testados;
- sessões revogáveis e encerramento de outras sessões funcionando;
- verificação de e-mail e recuperação entregues por remetente autenticado;
- permissões e propriedade verificadas novamente no servidor;
- backup restaurado com sucesso em ambiente isolado;
- Termos, Privacidade e versões de consentimento atualizados;
- domínio, HTTPS, health check, monitoramento e rollback validados.

## Ações que dependem do proprietário

- manter acesso às contas da Vercel, Supabase e Registro.br;
- cadastrar forma de pagamento somente quando o plano contratado exigir;
- confirmar o e-mail remetente e o endereço oficial de suporte;
- fornecer as variáveis secretas pelo painel seguro, nunca por arquivo público;
- alterar o DNS somente após a validação do novo ambiente.

Nenhuma troca de DNS será feita antes de o novo fluxo estar funcional e os dados terem sido conferidos.

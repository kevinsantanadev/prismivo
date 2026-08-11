# Contrato Resumido da API

## Convenções

- Prefixo externo: `/api/v1`;
- JSON UTF-8;
- Identificadores opacos;
- Datas ISO 8601 em UTC;
- Erros públicos estáveis;
- `Idempotency-Key` em contato, checkout e operações críticas;
- Paginação por cursor em feeds e por página em grids administrativos.

## Formato implementado no marco atual

As rotas internas usam um envelope pequeno e previsível:

### Sucesso

```json
{
  "ok": true,
  "data": {}
}
```

### Erro

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revise os campos informados.",
    "fields": { "email": "Informe um e-mail válido." }
  }
}
```

## Endpoints implementados

### Autenticação

- Server Actions de cadastro, login, recuperação e redefinição validam entradas com Zod;
- `GET /auth/callback` troca o código temporário por sessão e aceita somente retorno relativo seguro;
- `GET|POST /auth/signout` encerra a sessão e retorna à página pública;
- o Proxy renova os cookies de autenticação antes das rotas protegidas;
- a recuperação sempre usa uma resposta uniforme, exista ou não uma conta para o e-mail.

### `POST /api/onboarding`

- exige identidade confirmada e requisição da mesma origem;
- valida empresa, slug, segmento, tamanho da equipe e consentimento;
- cria usuário, organização, participação de proprietário e registros demonstrativos;
- é idempotente para uma identidade que já possui empresa.

### `POST /api/projects`

- exige identidade e organização ativa resolvidas no servidor;
- valida projeto, cliente e prazo;
- aplica o limite de três projetos do plano gratuito no servidor;
- cria cliente quando necessário e registra atividade e notificação.

### `POST /api/clients`

- cria um cliente somente dentro da organização resolvida pela sessão;
- valida nome, empresa e e-mail;
- aplica o limite do plano gratuito no servidor;
- registra atividade e notificação.

### `PATCH /api/projects/:id/progress`

- carrega o projeto já filtrado pela organização autenticada;
- aceita progresso inteiro entre 0 e 100;
- conclui o projeto automaticamente em 100%;
- registra a mudança no histórico.

### `POST /api/approvals`

- confirma que o projeto pertence à organização antes de criar a solicitação;
- registra título, contexto e prazo opcional;
- cria atividade e notificação vinculadas.

### `PATCH /api/approvals/:id`

- aceita apenas `approved` ou `changes_requested`;
- impede uma segunda decisão sobre a mesma solicitação;
- registra usuário, data e evento da decisão.

### `PATCH /api/notifications`

- marca uma notificação própria ou todas as notificações da conta como lidas;
- combina usuário e organização na cláusula de atualização.

### `PATCH /api/settings`

- altera perfil profissional, idioma e preferências acessíveis do próprio usuário;
- permite alterar identidade visual da empresa somente a administradores e proprietários;
- registra a atualização no histórico operacional.

### `POST|DELETE /api/profile/avatar`

- recebe JPG, PNG ou WebP de até 2 MB;
- valida MIME e assinatura binária;
- mantém a imagem em bucket privado do usuário e remove a versão anterior.

### `/api/team/*`

- cria convites com token aleatório armazenado somente como hash;
- aceita convite apenas uma vez, dentro do prazo e pelo e-mail correspondente;
- altera papel, suspende, remove membros e revoga convites com autorização server-side;
- impede administradores de promover equivalentes e protege o último proprietário ativo.

### `GET /app/administracao`

- é uma página server-rendered, não indexável e restrita a `owner` e `admin`;
- agrega métricas reais e a trilha recente sem aceitar organização informada pelo navegador.

### `POST /api/tasks` e `PATCH /api/tasks/:id`

- criam tarefas ligadas a projetos da empresa autenticada;
- aceitam apenas prioridades, prazos e estados previstos;
- registram atividade e conclusão sem confiar em `organization_id` do navegador.

### `POST /api/files`, `GET /api/files/:id/download` e `DELETE /api/files/:id`

- recebem multipart com limite de 5 MB e allowlist de formatos;
- cruzam MIME, extensão e assinatura binária antes do armazenamento;
- guardam bytes no bucket privado e metadados no banco;
- exigem autenticação e escopo da empresa para download ou exclusão.

### `POST /api/tickets`, `POST /api/tickets/:id/messages` e `PATCH /api/tickets/:id/status`

- criam protocolo opaco e validam cliente, prioridade e conteúdo;
- mantêm mensagens cronológicas somente dentro da organização;
- permitem encerramento e reabertura por transições controladas.

O navegador nunca informa `user_id`, `organization_id`, papel ou plano como autoridade.

### `GET /api/admin/reports`

- exporta em CSV a trilha operacional autorizada da organização;
- aceita `period` (`7`, `30` ou `90`), `type` e `query`;
- exige sessão válida e permissão `admin.view` verificada no servidor;
- limita a exportação a 1.000 registros e impede cache compartilhado;
- neutraliza células que poderiam ser interpretadas como fórmulas por planilhas.

### `POST /api/content` e `PATCH /api/content/:id`

- criam conteúdo isolado da organização e alteram apenas estados editoriais conhecidos;
- validam endereço, formato, tamanho, tags e permissão `content.write`;
- derivam autor e organização da sessão e registram a ação na trilha operacional.

### `POST /api/billing/subscription`

- ativa uma assinatura exclusivamente em modo demonstrativo;
- exige `owner` ou `admin` e valida novamente a permissão na RPC do banco;
- calcula o valor a partir da tabela `plans`, sem confiar em preço enviado pelo navegador;
- atualiza assinatura, histórico, plano da organização, atividade e notificação na mesma transação;
- não recebe nem armazena dados de cartão e não executa uma cobrança real.

### `POST /api/projects/:id/deliverables`

- cria um entregável apenas em projeto pertencente à organização da sessão;
- valida nome e descrição e deriva criador e organização no servidor;
- exige `deliverables.write` e registra a criação na trilha operacional.

### `POST /api/deliverables/:id/versions`

- recebe arquivo privado de até 5 MB com validação de extensão, MIME e assinatura;
- usa uma RPC transacional para bloquear o entregável, calcular o próximo número e impedir versões duplicadas;
- pode criar uma aprovação vinculada à versão sem confiar em identificadores de organização enviados pelo navegador;
- remove o arquivo enviado se o registro da versão falhar.

### `POST /api/deliverables/:id/comments`

- permite comentários para membros autorizados, inclusive leitores;
- verifica novamente no banco se entregável e versão opcional pertencem à mesma organização;
- limita o conteúdo e registra a interação no histórico.

### `POST /api/tickets/:id/attachments`

- reutiliza a validação binária e o bucket privado de arquivos;
- impede anexos em atendimento encerrado;
- exige permissão de suporte e mantém download sujeito ao escopo da organização.

## Endpoints principais planejados

### Segurança de conta

- `GET /auth/sessions`;
- `DELETE /auth/sessions/:id`;
- ativação e remoção de 2FA;
- log resumido de eventos de segurança.

### Organizações e clientes

- `GET|POST /api/v1/organizations`;
- `GET|PATCH /api/v1/organizations/:id`;
- `GET|POST /api/v1/organizations/:id/members`;
- `GET|POST /api/v1/clients`;
- `GET|PATCH|DELETE /api/v1/clients/:id`.

### Projetos e aprovações

- `GET|POST /api/v1/projects`;
- `GET|PATCH|DELETE /api/v1/projects/:id`;
- `GET|POST /api/v1/projects/:id/tasks`;
- `GET|PATCH|DELETE /api/v1/projects/:id/deliverables`;
- `PATCH|DELETE /api/v1/deliverables/:id/versions`;
- histórico avançado e comparação visual de versões.

### Arquivos

- `POST /api/v1/files/upload-intents`;
- `POST /api/v1/files/:id/complete`;
- `GET /api/v1/files/:id/download`;
- `DELETE /api/v1/files/:id`.

### Atendimento

- `GET|POST /api/v1/tickets`;
- `GET|PATCH /api/v1/tickets/:id`;
- `POST /api/v1/tickets/:id/messages`;
- `POST /api/v1/tickets/:id/close`;
- `POST /api/v1/tickets/:id/reopen`;
- `POST /api/v1/tickets/:id/rating`.

### Conteúdo e busca

- `GET /api/v1/content`;
- `GET /api/v1/content/:slug`;
- `GET /api/v1/search?q=&type=&cursor=`;
- endpoints administrativos protegidos para CRUD e publicação.

### Financeiro

- `GET /api/v1/plans`;
- `POST /api/v1/checkout`;
- `GET /api/v1/billing/history`;
- `POST /api/v1/subscriptions/:id/cancel`;
- `POST /api/v1/webhooks/payments`.

## Garantias de segurança

- `organization_id`, usuário, papel, preço e status não são aceitos como autoridade do navegador;
- Recurso é carregado já com escopo de organização;
- Webhooks validam assinatura e idempotência antes de alterar estado;
- Uploads têm tipo, tamanho, propriedade e prazo validados;
- Listagens filtram conteúdo privado antes de pesquisar ou paginar.

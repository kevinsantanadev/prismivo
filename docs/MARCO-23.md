# Marco 23 — Operação Inteligente

O Marco 23 evolui o Prismivo de um conjunto de módulos operacionais para um centro de decisão diário. A implementação é aditiva: autenticação, rotas existentes, regras de negócio, RLS e registros de origem continuam preservados.

## Primeiro recorte da prévia

- **Agenda unificada:** combina tarefas abertas, aprovações pendentes e prazos de projetos em uma linha do tempo pesquisável e filtrável.
- **Dashboard personalizável:** permite escolher quais áreas aparecem, mantendo ao menos três widgets e aplicando alterações somente depois de salvar.
- **Prismivo Pulse:** substitui o indicador demonstrativo por uma leitura determinística de atrasos, compromissos do dia, aprovações pendentes e projetos ativos.
- **Rotinas inteligentes:** configura antecedência por tipo de prazo e destaca os itens correspondentes sem modificar tarefas, aprovações ou projetos.
- **CRM operacional:** calcula saúde do relacionamento, progresso médio, projetos ativos, atrasos e próximo prazo usando os vínculos já existentes.
- **Transparência de permissões:** apresenta as capacidades de `owner`, `admin`, `editor`, `support` e `viewer` a partir da matriz usada no servidor.

## Persistência e segurança

Nesta prévia, a ordem do dashboard e as rotinas inteligentes são preferências locais por dispositivo. Essa decisão mantém o primeiro recorte compatível com o banco de produção e evita uma migração não autorizada.

A persistência por usuário e empresa será promovida em uma etapa própria, com tabelas, grants, RLS, políticas multiempresa e rollback revisados antes de qualquer alteração no Supabase de produção.

## Contratos preservados

- nenhum recurso anterior foi removido;
- nenhuma regra de autenticação ou autorização foi relaxada;
- consultas continuam limitadas à organização resolvida pela sessão;
- a Agenda apenas compõe dados existentes e mantém links para seus contextos originais;
- a interface de permissões não concede acesso: operações continuam validadas no servidor;
- nenhuma dependência visual ou biblioteca pesada foi adicionada.

## Qualidade e aceitação

O recorte só pode seguir para produção depois de:

1. testes unitários, tipagem, lint e build aprovados;
2. matriz Playwright aprovada em Chromium e WebKit;
3. ausência de overflow nas larguras 320, 360, 375, 390, 393, 412 e 430 px;
4. inspeção das rotas novas em preview autenticado;
5. verificação de navegação por teclado, foco, áreas de toque e contraste;
6. revisão do diff de banco — quando houver — antes de aplicar qualquer migração;
7. aprovação explícita do proprietário para promover a versão pública.

## Próxima etapa do marco

Depois da validação desta prévia, o Marco 23 pode ganhar persistência multi-dispositivo das preferências e rotinas, notificações geradas no servidor e controles administrativos para regras da organização. Essas mudanças não fazem parte deste primeiro recorte e exigem revisão específica de banco e operação.

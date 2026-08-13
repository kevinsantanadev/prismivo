-- Marco 20 — auditoria final de segurança e desempenho antes da produção.

-- O limitador de autenticação é invocado apenas pelo servidor com a credencial
-- de serviço. A função continua validando buckets e hashes antes de escrever.
revoke all on function public.consume_rate_limit(text, text) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text) to service_role;

-- Índices de cobertura para chaves estrangeiras usadas em exclusões, auditoria
-- e consultas administrativas. Índices de baixa utilização permanecem porque
-- o ambiente ainda possui pouco tráfego real.
create index if not exists activities_actor_user_idx
  on public.activities(actor_user_id) where actor_user_id is not null;
create index if not exists approvals_decided_by_user_idx
  on public.approvals(decided_by_user_id) where decided_by_user_id is not null;
create index if not exists files_uploaded_by_user_idx
  on public.files(uploaded_by_user_id);
create index if not exists organization_invitations_accepted_by_idx
  on public.organization_invitations(accepted_by) where accepted_by is not null;
create index if not exists organization_invitations_invited_by_idx
  on public.organization_invitations(invited_by);
create index if not exists organizations_created_by_idx
  on public.organizations(created_by);
create index if not exists support_tickets_client_idx
  on public.support_tickets(client_id) where client_id is not null;
create index if not exists ticket_messages_author_user_idx
  on public.ticket_messages(author_user_id);

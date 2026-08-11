-- Prismivo — PostgreSQL/Supabase foundation
-- Multi-tenant data is isolated by organization with RLS on every exposed table.

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  locale text not null default 'pt-BR' check (locale in ('pt-BR', 'en', 'es')),
  status text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id text primary key default ('org_' || gen_random_uuid()::text),
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  industry text not null,
  team_size text not null,
  plan text not null default 'free' check (plan in ('free', 'essential', 'professional', 'scale')),
  status text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id text primary key default ('mem_' || gen_random_uuid()::text),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id text not null references public.organizations(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'editor', 'support', 'viewer')),
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  joined_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

create index memberships_organization_idx on public.memberships(organization_id);
create index memberships_user_status_idx on public.memberships(user_id, status);

create or replace function private.has_org_access(target_organization_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.memberships membership
    where membership.user_id = auth.uid()
      and membership.organization_id = target_organization_id
      and membership.status = 'active'
  );
$$;

create or replace function private.has_org_role(target_organization_id text, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.memberships membership
    where membership.user_id = auth.uid()
      and membership.organization_id = target_organization_id
      and membership.status = 'active'
      and membership.role = any(allowed_roles)
  );
$$;

revoke all on function private.has_org_access(text) from public;
revoke all on function private.has_org_role(text, text[]) from public;
grant execute on function private.has_org_access(text) to authenticated;
grant execute on function private.has_org_role(text, text[]) to authenticated;

create table public.clients (
  id text primary key default ('cli_' || gen_random_uuid()::text),
  organization_id text not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  email text,
  company text,
  status text not null default 'active' check (status in ('active', 'archived')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_organization_idx on public.clients(organization_id);
create index clients_org_status_idx on public.clients(organization_id, status);

create table public.projects (
  id text primary key default ('prj_' || gen_random_uuid()::text),
  organization_id text not null references public.organizations(id) on delete cascade,
  client_id text references public.clients(id) on delete set null,
  name text not null check (char_length(name) between 2 and 140),
  description text not null default '',
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  progress integer not null default 0 check (progress between 0 and 100),
  due_date date,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_organization_idx on public.projects(organization_id);
create index projects_org_status_idx on public.projects(organization_id, status);
create index projects_client_idx on public.projects(client_id);

create table public.approvals (
  id text primary key default ('apr_' || gen_random_uuid()::text),
  organization_id text not null references public.organizations(id) on delete cascade,
  project_id text not null references public.projects(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  description text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'changes_requested')),
  due_date date,
  decided_by_user_id uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index approvals_organization_idx on public.approvals(organization_id);
create index approvals_project_idx on public.approvals(project_id);
create index approvals_org_status_idx on public.approvals(organization_id, status);

create table public.tasks (
  id text primary key default ('tsk_' || gen_random_uuid()::text),
  organization_id text not null references public.organizations(id) on delete cascade,
  project_id text not null references public.projects(id) on delete cascade,
  assignee_user_id uuid references auth.users(id) on delete set null,
  title text not null check (char_length(title) between 2 and 160),
  description text not null default '',
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_organization_idx on public.tasks(organization_id);
create index tasks_project_idx on public.tasks(project_id);
create index tasks_org_status_idx on public.tasks(organization_id, status);
create index tasks_assignee_idx on public.tasks(assignee_user_id);

create table public.files (
  id text primary key default ('fil_' || gen_random_uuid()::text),
  organization_id text not null references public.organizations(id) on delete cascade,
  project_id text references public.projects(id) on delete set null,
  uploaded_by_user_id uuid not null references auth.users(id) on delete restrict,
  storage_key text not null unique,
  original_name text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 5242880),
  status text not null default 'available' check (status in ('available', 'deleted', 'quarantined')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index files_organization_idx on public.files(organization_id);
create index files_project_idx on public.files(project_id);
create index files_org_status_idx on public.files(organization_id, status);

create table public.support_tickets (
  id text primary key default ('tic_' || gen_random_uuid()::text),
  organization_id text not null references public.organizations(id) on delete cascade,
  requester_user_id uuid not null references auth.users(id) on delete restrict,
  client_id text references public.clients(id) on delete set null,
  protocol text not null unique,
  category text not null,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  subject text not null,
  status text not null default 'open' check (status in ('open', 'waiting', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create index support_tickets_organization_idx on public.support_tickets(organization_id);
create index support_tickets_org_status_idx on public.support_tickets(organization_id, status);
create index support_tickets_requester_idx on public.support_tickets(requester_user_id);

create table public.ticket_messages (
  id text primary key default ('msg_' || gen_random_uuid()::text),
  ticket_id text not null references public.support_tickets(id) on delete cascade,
  organization_id text not null references public.organizations(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 10000),
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create index ticket_messages_ticket_created_idx on public.ticket_messages(ticket_id, created_at);
create index ticket_messages_organization_idx on public.ticket_messages(organization_id);

create table public.activities (
  id text primary key default ('act_' || gen_random_uuid()::text),
  organization_id text not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  type text not null,
  title text not null,
  detail text not null default '',
  resource_type text,
  resource_id text,
  created_at timestamptz not null default now()
);

create index activities_org_created_idx on public.activities(organization_id, created_at desc);

create table public.notifications (
  id text primary key default ('not_' || gen_random_uuid()::text),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id text not null references public.organizations(id) on delete cascade,
  category text not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_read_idx on public.notifications(user_id, read_at);
create index notifications_org_created_idx on public.notifications(organization_id, created_at desc);

create table public.consents (
  id text primary key default ('con_' || gen_random_uuid()::text),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('terms_of_use', 'privacy_notice', 'cookies_optional', 'marketing')),
  version text not null,
  accepted boolean not null,
  accepted_at timestamptz not null default now()
);

create index consents_user_type_idx on public.consents(user_id, type, accepted_at desc);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.approvals enable row level security;
alter table public.tasks enable row level security;
alter table public.files enable row level security;
alter table public.support_tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.activities enable row level security;
alter table public.notifications enable row level security;
alter table public.consents enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy organizations_select_member on public.organizations
  for select to authenticated
  using (created_by = (select auth.uid()) or private.has_org_access(id));
create policy organizations_insert_owner on public.organizations
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy organizations_update_owner on public.organizations
  for update to authenticated
  using (created_by = (select auth.uid()) or private.has_org_role(id, array['owner', 'admin']))
  with check (created_by = (select auth.uid()) or private.has_org_role(id, array['owner', 'admin']));
create policy organizations_delete_owner on public.organizations
  for delete to authenticated using (created_by = (select auth.uid()));

create policy memberships_select_member on public.memberships
  for select to authenticated
  using (user_id = (select auth.uid()) or private.has_org_access(organization_id));
create policy memberships_insert_owner on public.memberships
  for insert to authenticated
  with check (
    (user_id = (select auth.uid()) and exists (
      select 1 from public.organizations organization
      where organization.id = organization_id
        and organization.created_by = (select auth.uid())
    ))
    or private.has_org_role(organization_id, array['owner', 'admin'])
  );
create policy memberships_update_owner on public.memberships
  for update to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']))
  with check (private.has_org_role(organization_id, array['owner', 'admin']));
create policy memberships_delete_owner on public.memberships
  for delete to authenticated
  using (private.has_org_role(organization_id, array['owner']));

create policy clients_member_all on public.clients
  for all to authenticated
  using (private.has_org_access(organization_id))
  with check (private.has_org_access(organization_id));
create policy projects_member_all on public.projects
  for all to authenticated
  using (private.has_org_access(organization_id))
  with check (private.has_org_access(organization_id));
create policy approvals_member_all on public.approvals
  for all to authenticated
  using (private.has_org_access(organization_id))
  with check (private.has_org_access(organization_id));
create policy tasks_member_all on public.tasks
  for all to authenticated
  using (private.has_org_access(organization_id))
  with check (private.has_org_access(organization_id));
create policy files_member_all on public.files
  for all to authenticated
  using (private.has_org_access(organization_id))
  with check (private.has_org_access(organization_id));
create policy tickets_member_all on public.support_tickets
  for all to authenticated
  using (private.has_org_access(organization_id))
  with check (private.has_org_access(organization_id));
create policy ticket_messages_member_all on public.ticket_messages
  for all to authenticated
  using (private.has_org_access(organization_id))
  with check (private.has_org_access(organization_id));
create policy activities_member_select on public.activities
  for select to authenticated using (private.has_org_access(organization_id));
create policy activities_member_insert on public.activities
  for insert to authenticated with check (private.has_org_access(organization_id));
create policy notifications_select_own on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()) and private.has_org_access(organization_id));
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()) and private.has_org_access(organization_id))
  with check (user_id = (select auth.uid()) and private.has_org_access(organization_id));
create policy notifications_insert_member on public.notifications
  for insert to authenticated
  with check (private.has_org_access(organization_id));
create policy consents_select_own on public.consents
  for select to authenticated using (user_id = (select auth.uid()));
create policy consents_insert_own on public.consents
  for insert to authenticated with check (user_id = (select auth.uid()));

grant usage on schema public to authenticated;
grant select, insert on public.profiles to authenticated;
grant update (name, locale, status, updated_at) on public.profiles to authenticated;
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.memberships to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.approvals to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.files to authenticated;
grant select, insert, update, delete on public.support_tickets to authenticated;
grant select, insert, update, delete on public.ticket_messages to authenticated;
grant select, insert on public.activities to authenticated;
grant select, insert, update on public.notifications to authenticated;
grant select, insert on public.consents to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'prismivo-files',
  'prismivo-files',
  false,
  5242880,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'text/plain',
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy prismivo_files_select_member on storage.objects
  for select to authenticated
  using (
    bucket_id = 'prismivo-files'
    and private.has_org_access((storage.foldername(name))[1])
  );
create policy prismivo_files_insert_member on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'prismivo-files'
    and owner_id = (select auth.uid()::text)
    and private.has_org_access((storage.foldername(name))[1])
  );
create policy prismivo_files_update_owner on storage.objects
  for update to authenticated
  using (
    bucket_id = 'prismivo-files'
    and owner_id = (select auth.uid()::text)
    and private.has_org_access((storage.foldername(name))[1])
  )
  with check (
    bucket_id = 'prismivo-files'
    and owner_id = (select auth.uid()::text)
    and private.has_org_access((storage.foldername(name))[1])
  );
create policy prismivo_files_delete_owner on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'prismivo-files'
    and owner_id = (select auth.uid()::text)
    and private.has_org_access((storage.foldername(name))[1])
  );

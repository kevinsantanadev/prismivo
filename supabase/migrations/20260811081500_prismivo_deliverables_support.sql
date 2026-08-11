-- Marco 10 — entregáveis versionados, comentários e anexos de atendimento.

create table public.deliverables (
  id text primary key default ('del_' || gen_random_uuid()::text),
  organization_id text not null references public.organizations(id) on delete cascade,
  project_id text not null references public.projects(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(title) between 3 and 140),
  description text not null default '' check (char_length(description) <= 1200),
  status text not null default 'draft' check (status in ('draft', 'in_review', 'approved', 'changes_requested', 'archived')),
  current_version_number integer not null default 0 check (current_version_number >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deliverables_project_created_idx on public.deliverables(project_id, created_at desc);
create index deliverables_org_status_idx on public.deliverables(organization_id, status);

create table public.deliverable_versions (
  id text primary key default ('dvr_' || gen_random_uuid()::text),
  deliverable_id text not null references public.deliverables(id) on delete cascade,
  organization_id text not null references public.organizations(id) on delete cascade,
  file_id text not null references public.files(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  summary text not null default '' check (char_length(summary) <= 1000),
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (deliverable_id, version_number)
);

create index deliverable_versions_org_created_idx on public.deliverable_versions(organization_id, created_at desc);
create index deliverable_versions_file_idx on public.deliverable_versions(file_id);

create table public.deliverable_comments (
  id text primary key default ('dcm_' || gen_random_uuid()::text),
  deliverable_id text not null references public.deliverables(id) on delete cascade,
  version_id text references public.deliverable_versions(id) on delete cascade,
  organization_id text not null references public.organizations(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete restrict,
  body text not null check (char_length(body) between 2 and 3000),
  created_at timestamptz not null default now()
);

create index deliverable_comments_deliverable_created_idx on public.deliverable_comments(deliverable_id, created_at);
create index deliverable_comments_version_idx on public.deliverable_comments(version_id) where version_id is not null;
create index deliverable_comments_org_idx on public.deliverable_comments(organization_id);

create table public.ticket_attachments (
  id text primary key default ('tat_' || gen_random_uuid()::text),
  ticket_id text not null references public.support_tickets(id) on delete cascade,
  message_id text references public.ticket_messages(id) on delete set null,
  file_id text not null unique references public.files(id) on delete restrict,
  organization_id text not null references public.organizations(id) on delete cascade,
  uploaded_by_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index ticket_attachments_ticket_created_idx on public.ticket_attachments(ticket_id, created_at);
create index ticket_attachments_message_idx on public.ticket_attachments(message_id) where message_id is not null;
create index ticket_attachments_org_idx on public.ticket_attachments(organization_id);

alter table public.approvals
  add column deliverable_version_id text references public.deliverable_versions(id) on delete set null;
create index approvals_deliverable_version_idx on public.approvals(deliverable_version_id) where deliverable_version_id is not null;

alter table public.deliverables enable row level security;
alter table public.deliverable_versions enable row level security;
alter table public.deliverable_comments enable row level security;
alter table public.ticket_attachments enable row level security;

create policy deliverables_member_select on public.deliverables for select to authenticated
  using (private.has_org_access(organization_id));
create policy deliverables_editor_insert on public.deliverables for insert to authenticated
  with check (
    created_by_user_id = (select auth.uid())
    and private.has_org_role(organization_id, array['owner', 'admin', 'editor'])
    and exists (
      select 1 from public.projects project
      where project.id = deliverables.project_id
        and project.organization_id = deliverables.organization_id
    )
  );
create policy deliverables_editor_update on public.deliverables for update to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin', 'editor']))
  with check (private.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy deliverables_admin_delete on public.deliverables for delete to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

create policy deliverable_versions_member_select on public.deliverable_versions for select to authenticated
  using (private.has_org_access(organization_id));
create policy deliverable_versions_editor_insert on public.deliverable_versions for insert to authenticated
  with check (
    created_by_user_id = (select auth.uid())
    and private.has_org_role(organization_id, array['owner', 'admin', 'editor'])
    and exists (
      select 1
      from public.deliverables deliverable
      join public.files stored_file on stored_file.id = deliverable_versions.file_id
      where deliverable.id = deliverable_versions.deliverable_id
        and deliverable.organization_id = deliverable_versions.organization_id
        and stored_file.organization_id = deliverable_versions.organization_id
        and stored_file.project_id = deliverable.project_id
        and stored_file.status = 'available'
    )
  );
create policy deliverable_versions_admin_delete on public.deliverable_versions for delete to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

create policy deliverable_comments_member_select on public.deliverable_comments for select to authenticated
  using (private.has_org_access(organization_id));
create policy deliverable_comments_member_insert on public.deliverable_comments for insert to authenticated
  with check (
    author_user_id = (select auth.uid())
    and private.has_org_access(organization_id)
    and exists (
      select 1 from public.deliverables deliverable
      where deliverable.id = deliverable_comments.deliverable_id
        and deliverable.organization_id = deliverable_comments.organization_id
    )
    and (
      version_id is null
      or exists (
        select 1 from public.deliverable_versions version
        where version.id = deliverable_comments.version_id
          and version.deliverable_id = deliverable_comments.deliverable_id
          and version.organization_id = deliverable_comments.organization_id
      )
    )
  );
create policy deliverable_comments_author_delete on public.deliverable_comments for delete to authenticated
  using (
    author_user_id = (select auth.uid())
    or private.has_org_role(organization_id, array['owner', 'admin'])
  );

create policy ticket_attachments_member_select on public.ticket_attachments for select to authenticated
  using (private.has_org_access(organization_id));
create policy ticket_attachments_operator_insert on public.ticket_attachments for insert to authenticated
  with check (
    uploaded_by_user_id = (select auth.uid())
    and private.has_org_role(organization_id, array['owner', 'admin', 'editor', 'support'])
    and exists (
      select 1 from public.support_tickets ticket
      where ticket.id = ticket_attachments.ticket_id
        and ticket.organization_id = ticket_attachments.organization_id
    )
    and exists (
      select 1 from public.files stored_file
      where stored_file.id = ticket_attachments.file_id
        and stored_file.organization_id = ticket_attachments.organization_id
        and stored_file.uploaded_by_user_id = (select auth.uid())
        and stored_file.status = 'available'
    )
    and (
      message_id is null
      or exists (
        select 1 from public.ticket_messages message
        where message.id = ticket_attachments.message_id
          and message.ticket_id = ticket_attachments.ticket_id
          and message.organization_id = ticket_attachments.organization_id
      )
    )
  );
create policy ticket_attachments_author_delete on public.ticket_attachments for delete to authenticated
  using (
    uploaded_by_user_id = (select auth.uid())
    or private.has_org_role(organization_id, array['owner', 'admin'])
  );

grant select, insert, update, delete on public.deliverables to authenticated;
grant select, insert, delete on public.deliverable_versions to authenticated;
grant select, insert, delete on public.deliverable_comments to authenticated;
grant select, insert, delete on public.ticket_attachments to authenticated;

create or replace function public.create_deliverable_version(
  target_deliverable_id text,
  target_file_id text,
  target_summary text default '',
  target_request_approval boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  target_organization_id text;
  target_project_id text;
  target_title text;
  next_version integer;
  created_version_id text := 'dvr_' || gen_random_uuid()::text;
  created_approval_id text;
begin
  if actor_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select item.organization_id, item.project_id, item.title, item.current_version_number + 1
    into target_organization_id, target_project_id, target_title, next_version
  from public.deliverables item
  where item.id = target_deliverable_id
  for update;

  if target_organization_id is null then
    raise exception 'DELIVERABLE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not private.has_org_role(target_organization_id, array['owner', 'admin', 'editor']) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.files item
    where item.id = target_file_id
      and item.organization_id = target_organization_id
      and item.project_id = target_project_id
      and item.status = 'available'
      and item.uploaded_by_user_id = actor_id
  ) then
    raise exception 'FILE_NOT_FOUND' using errcode = 'P0002';
  end if;

  insert into public.deliverable_versions(
    id, deliverable_id, organization_id, file_id, version_number, summary, created_by_user_id
  ) values (
    created_version_id, target_deliverable_id, target_organization_id, target_file_id,
    next_version, left(coalesce(target_summary, ''), 1000), actor_id
  );

  update public.deliverables
  set current_version_number = next_version,
      status = case when target_request_approval then 'in_review' else 'draft' end,
      updated_at = now()
  where id = target_deliverable_id;

  if target_request_approval then
    created_approval_id := 'apr_' || gen_random_uuid()::text;
    insert into public.approvals(
      id, organization_id, project_id, deliverable_version_id, title, description
    ) values (
      created_approval_id, target_organization_id, target_project_id, created_version_id,
      'Aprovar ' || target_title || ' · v' || next_version,
      'Versão enviada para revisão pelo fluxo de entregáveis.'
    );
  end if;

  insert into public.activities(
    id, organization_id, actor_user_id, type, title, detail, resource_type, resource_id
  ) values (
    'act_' || gen_random_uuid()::text, target_organization_id, actor_id,
    'deliverable.version_created', 'Nova versão de entregável',
    target_title || ' avançou para a versão ' || next_version || '.',
    'deliverable', target_deliverable_id
  );

  return jsonb_build_object(
    'id', created_version_id,
    'versionNumber', next_version,
    'approvalId', created_approval_id
  );
end;
$$;

revoke all on function public.create_deliverable_version(text, text, text, boolean) from public, anon;
grant execute on function public.create_deliverable_version(text, text, text, boolean) to authenticated;

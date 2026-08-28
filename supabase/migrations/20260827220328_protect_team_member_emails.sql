-- Personal e-mail addresses are private to their owners. The roster remains
-- available to organization members, but this RPC never exposes another
-- member's address, even when called directly outside the Prismivo UI.

create or replace function public.get_organization_members(p_organization_id text)
returns table(
  membership_id text,
  user_id uuid,
  member_name text,
  member_email text,
  member_role text,
  member_status text,
  joined_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.has_org_access(p_organization_id) then
    raise exception 'Acesso não autorizado.' using errcode = '42501';
  end if;

  return query
  select membership.id,
         membership.user_id,
         coalesce(profile.name, 'Membro'),
         case when membership.user_id = (select auth.uid()) then profile.email else null::text end,
         membership.role,
         membership.status,
         membership.joined_at
  from public.memberships membership
  join public.profiles profile on profile.id = membership.user_id
  where membership.organization_id = p_organization_id
  order by case membership.role when 'owner' then 1 when 'admin' then 2 when 'editor' then 3 when 'support' then 4 else 5 end,
           lower(profile.name);
end;
$$;

revoke execute on function public.get_organization_members(text) from public, anon;
grant execute on function public.get_organization_members(text) to authenticated;

-- Project capacity is a database invariant, not a browser convention. Locking
-- the organization row serializes simultaneous creates/restores so concurrent
-- requests cannot exceed the plan.
create or replace function private.enforce_active_project_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_limit integer;
  active_total integer;
begin
  if new.status <> 'active' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'active' then
    return new;
  end if;

  select coalesce((plan.limits ->> 'active_projects')::integer, -1)
    into active_limit
  from public.organizations organization
  join public.plans plan on plan.code = organization.plan and plan.active = true
  where organization.id = new.organization_id
  for update of organization;

  if active_limit is null then
    raise exception 'PLAN_LIMIT_REACHED' using errcode = '23514';
  end if;

  if active_limit >= 0 then
    select count(*)::integer
      into active_total
    from public.projects project
    where project.organization_id = new.organization_id
      and project.status = 'active'
      and project.id <> new.id;

    if active_total >= active_limit then
      raise exception 'PLAN_LIMIT_REACHED' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists projects_active_limit_guard on public.projects;
create trigger projects_active_limit_guard
before insert or update of status on public.projects
for each row execute function private.enforce_active_project_limit();

revoke all on function private.enforce_active_project_limit() from public, anon, authenticated;

-- Editors may archive and update projects, but irreversible deletion is an
-- administrative action in both the API route and the database policy.
drop policy if exists projects_editor_delete on public.projects;
drop policy if exists projects_admin_delete on public.projects;
create policy projects_admin_delete on public.projects
  for delete to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

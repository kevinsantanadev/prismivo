-- Marco 5 — colaboração, convites de uso único e gestão protegida de papéis.

create table if not exists public.organization_invitations (
  id text primary key default ('inv_' || gen_random_uuid()::text),
  organization_id text not null references public.organizations(id) on delete cascade,
  email text not null check (char_length(email) between 5 and 254),
  role text not null check (role in ('admin', 'editor', 'support', 'viewer')),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  invited_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_invitations_org_created_idx
  on public.organization_invitations(organization_id, created_at desc);
create index if not exists organization_invitations_expiry_idx
  on public.organization_invitations(status, expires_at) where status = 'pending';
create unique index if not exists organization_invitations_pending_email_idx
  on public.organization_invitations(organization_id, lower(email)) where status = 'pending';

alter table public.organization_invitations enable row level security;
revoke all on public.organization_invitations from anon, authenticated;

create or replace function public.create_organization_invitation(
  p_organization_id text,
  p_email text,
  p_role text,
  p_token_hash text,
  p_expires_at timestamptz
)
returns table(invitation_id text, invitation_expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_role text;
  normalized_email text := lower(trim(p_email));
  created_id text;
begin
  select membership.role into caller_role
  from public.memberships membership
  where membership.organization_id = p_organization_id
    and membership.user_id = auth.uid()
    and membership.status = 'active';

  if caller_role is null or caller_role not in ('owner', 'admin') then
    raise exception 'Acesso não autorizado.' using errcode = '42501';
  end if;
  if p_role not in ('admin', 'editor', 'support', 'viewer') then
    raise exception 'Papel inválido.' using errcode = '22023';
  end if;
  if caller_role = 'admin' and p_role = 'admin' then
    raise exception 'Administradores não podem conceder um papel equivalente.' using errcode = '42501';
  end if;
  if normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'E-mail inválido.' using errcode = '22023';
  end if;
  if p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Token inválido.' using errcode = '22023';
  end if;
  if p_expires_at <= now() + interval '5 minutes' or p_expires_at > now() + interval '7 days' then
    raise exception 'Prazo do convite inválido.' using errcode = '22023';
  end if;

  update public.organization_invitations
  set status = 'revoked', updated_at = now()
  where organization_id = p_organization_id
    and lower(email) = normalized_email
    and status = 'pending';

  insert into public.organization_invitations (
    organization_id, email, role, token_hash, invited_by, expires_at
  ) values (
    p_organization_id, normalized_email, p_role, p_token_hash, auth.uid(), p_expires_at
  ) returning id into created_id;

  insert into public.activities (
    organization_id, actor_user_id, type, title, detail, resource_type, resource_id
  ) values (
    p_organization_id, auth.uid(), 'member.invited', 'Convite de equipe criado',
    normalized_email || ' recebeu um convite de acesso.', 'invitation', created_id
  );

  return query select created_id, p_expires_at;
end;
$$;

create or replace function public.accept_organization_invitation(p_token_hash text)
returns table(organization_id text, organization_name text, membership_role text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.organization_invitations%rowtype;
  signed_email text;
begin
  if auth.uid() is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Convite inválido ou expirado.' using errcode = '22023';
  end if;

  select lower(auth_user.email) into signed_email
  from auth.users auth_user
  where auth_user.id = auth.uid();

  select * into invitation
  from public.organization_invitations candidate
  where candidate.token_hash = p_token_hash
  for update;

  if invitation.id is null
     or invitation.status <> 'pending'
     or invitation.expires_at <= now()
     or lower(invitation.email) <> signed_email then
    raise exception 'Convite inválido ou expirado.' using errcode = '22023';
  end if;

  insert into public.memberships (user_id, organization_id, role, status, joined_at)
  values (auth.uid(), invitation.organization_id, invitation.role, 'active', now())
  on conflict (user_id, organization_id) do update
    set role = excluded.role, status = 'active', joined_at = now();

  update public.organization_invitations
  set status = 'accepted', accepted_by = auth.uid(), accepted_at = now(), updated_at = now()
  where id = invitation.id;

  insert into public.activities (
    organization_id, actor_user_id, type, title, detail, resource_type, resource_id
  ) values (
    invitation.organization_id, auth.uid(), 'member.joined', 'Novo membro entrou na equipe',
    signed_email || ' aceitou o convite.', 'membership', invitation.id
  );

  return query
  select organization.id, organization.name, invitation.role
  from public.organizations organization
  where organization.id = invitation.organization_id;
end;
$$;

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
  select membership.id, membership.user_id, coalesce(profile.name, 'Membro'), profile.email,
         membership.role, membership.status, membership.joined_at
  from public.memberships membership
  join public.profiles profile on profile.id = membership.user_id
  where membership.organization_id = p_organization_id
  order by case membership.role when 'owner' then 1 when 'admin' then 2 when 'editor' then 3 when 'support' then 4 else 5 end,
           lower(profile.name);
end;
$$;

create or replace function public.get_organization_invitations(p_organization_id text)
returns table(
  invitation_id text,
  invitation_email text,
  invitation_role text,
  invitation_status text,
  invitation_expires_at timestamptz,
  invitation_created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.has_org_role(p_organization_id, array['owner', 'admin']) then
    raise exception 'Acesso não autorizado.' using errcode = '42501';
  end if;
  return query
  select invitation.id, invitation.email, invitation.role,
         case when invitation.status = 'pending' and invitation.expires_at <= now() then 'expired' else invitation.status end,
         invitation.expires_at, invitation.created_at
  from public.organization_invitations invitation
  where invitation.organization_id = p_organization_id
    and invitation.status in ('pending', 'accepted')
  order by invitation.created_at desc;
end;
$$;

create or replace function public.update_organization_member(
  p_organization_id text,
  p_membership_id text,
  p_role text,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_role text;
  target public.memberships%rowtype;
  active_owner_count integer;
begin
  select membership.role into caller_role from public.memberships membership
  where membership.organization_id = p_organization_id and membership.user_id = auth.uid() and membership.status = 'active';
  select * into target from public.memberships membership
  where membership.id = p_membership_id and membership.organization_id = p_organization_id for update;

  if caller_role is null or caller_role not in ('owner', 'admin') or target.id is null then
    raise exception 'Acesso não autorizado.' using errcode = '42501';
  end if;
  if p_role not in ('owner', 'admin', 'editor', 'support', 'viewer') or p_status not in ('active', 'suspended') then
    raise exception 'Papel ou status inválido.' using errcode = '22023';
  end if;
  if caller_role = 'admin' and (target.role in ('owner', 'admin') or p_role in ('owner', 'admin')) then
    raise exception 'Acesso não autorizado.' using errcode = '42501';
  end if;
  if target.role = 'owner' and (p_role <> 'owner' or p_status <> 'active') then
    select count(*) into active_owner_count from public.memberships membership
    where membership.organization_id = p_organization_id and membership.role = 'owner' and membership.status = 'active';
    if active_owner_count <= 1 then
      raise exception 'A organização precisa manter ao menos um proprietário ativo.' using errcode = '23514';
    end if;
  end if;

  update public.memberships set role = p_role, status = p_status where id = p_membership_id;
  insert into public.activities (organization_id, actor_user_id, type, title, detail, resource_type, resource_id)
  values (p_organization_id, auth.uid(), 'member.updated', 'Acesso de membro atualizado',
          'Papel: ' || p_role || '; status: ' || p_status || '.', 'membership', p_membership_id);
  return true;
end;
$$;

create or replace function public.remove_organization_member(p_organization_id text, p_membership_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_role text;
  target public.memberships%rowtype;
  active_owner_count integer;
begin
  select membership.role into caller_role from public.memberships membership
  where membership.organization_id = p_organization_id and membership.user_id = auth.uid() and membership.status = 'active';
  select * into target from public.memberships membership
  where membership.id = p_membership_id and membership.organization_id = p_organization_id for update;

  if caller_role is null or caller_role not in ('owner', 'admin') or target.id is null then
    raise exception 'Acesso não autorizado.' using errcode = '42501';
  end if;
  if caller_role = 'admin' and target.role in ('owner', 'admin') then
    raise exception 'Acesso não autorizado.' using errcode = '42501';
  end if;
  if target.role = 'owner' then
    select count(*) into active_owner_count from public.memberships membership
    where membership.organization_id = p_organization_id and membership.role = 'owner' and membership.status = 'active';
    if active_owner_count <= 1 then
      raise exception 'A organização precisa manter ao menos um proprietário ativo.' using errcode = '23514';
    end if;
  end if;

  delete from public.memberships where id = p_membership_id;
  insert into public.activities (organization_id, actor_user_id, type, title, detail, resource_type, resource_id)
  values (p_organization_id, auth.uid(), 'member.removed', 'Membro removido da equipe',
          'O acesso do membro foi encerrado.', 'membership', p_membership_id);
  return true;
end;
$$;

create or replace function public.revoke_organization_invitation(p_organization_id text, p_invitation_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_role text;
  invitation_role text;
begin
  select membership.role into caller_role from public.memberships membership
  where membership.organization_id = p_organization_id and membership.user_id = auth.uid() and membership.status = 'active';
  select invitation.role into invitation_role from public.organization_invitations invitation
  where invitation.id = p_invitation_id and invitation.organization_id = p_organization_id and invitation.status = 'pending';

  if caller_role is null or caller_role not in ('owner', 'admin') or invitation_role is null then
    raise exception 'Acesso não autorizado.' using errcode = '42501';
  end if;
  if caller_role = 'admin' and invitation_role = 'admin' then
    raise exception 'Acesso não autorizado.' using errcode = '42501';
  end if;

  update public.organization_invitations set status = 'revoked', updated_at = now() where id = p_invitation_id;
  insert into public.activities (organization_id, actor_user_id, type, title, detail, resource_type, resource_id)
  values (p_organization_id, auth.uid(), 'member.invite_revoked', 'Convite revogado',
          'Um convite pendente foi revogado.', 'invitation', p_invitation_id);
  return true;
end;
$$;

revoke all on function public.create_organization_invitation(text, text, text, text, timestamptz) from public, anon;
revoke all on function public.accept_organization_invitation(text) from public, anon;
revoke all on function public.get_organization_members(text) from public, anon;
revoke all on function public.get_organization_invitations(text) from public, anon;
revoke all on function public.update_organization_member(text, text, text, text) from public, anon;
revoke all on function public.remove_organization_member(text, text) from public, anon;
revoke all on function public.revoke_organization_invitation(text, text) from public, anon;

grant execute on function public.create_organization_invitation(text, text, text, text, timestamptz) to authenticated;
grant execute on function public.accept_organization_invitation(text) to authenticated;
grant execute on function public.get_organization_members(text) to authenticated;
grant execute on function public.get_organization_invitations(text) to authenticated;
grant execute on function public.update_organization_member(text, text, text, text) to authenticated;
grant execute on function public.remove_organization_member(text, text) to authenticated;
grant execute on function public.revoke_organization_invitation(text, text) to authenticated;

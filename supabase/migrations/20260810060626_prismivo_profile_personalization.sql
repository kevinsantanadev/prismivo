-- Marco 6 — perfil profissional, avatar privado e preferências acessíveis.

alter table public.profiles
  add column if not exists avatar_path text,
  add column if not exists bio text not null default '',
  add column if not exists job_title text not null default '',
  add column if not exists phone text not null default '',
  add column if not exists location text not null default '',
  add column if not exists website text not null default '',
  add column if not exists accent_color text not null default 'lime',
  add column if not exists interface_filter text not null default 'none',
  add column if not exists color_vision_mode text not null default 'standard';

alter table public.organizations
  add column if not exists brand_color text not null default 'lime',
  add column if not exists visual_style text not null default 'prism';

alter table public.profiles
  add constraint profiles_avatar_path_format check (avatar_path is null or avatar_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'),
  add constraint profiles_bio_length check (char_length(bio) <= 360),
  add constraint profiles_job_title_length check (char_length(job_title) <= 100),
  add constraint profiles_phone_length check (char_length(phone) <= 32),
  add constraint profiles_location_length check (char_length(location) <= 100),
  add constraint profiles_website_length check (char_length(website) <= 240),
  add constraint profiles_accent_color_valid check (accent_color in ('lime', 'violet', 'blue', 'amber', 'teal', 'rose')),
  add constraint profiles_interface_filter_valid check (interface_filter in ('none', 'soft', 'crisp', 'grayscale')),
  add constraint profiles_color_vision_mode_valid check (color_vision_mode in ('standard', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'));

alter table public.organizations
  add constraint organizations_brand_color_valid check (brand_color in ('lime', 'violet', 'blue', 'amber', 'teal', 'rose')),
  add constraint organizations_visual_style_valid check (visual_style in ('prism', 'minimal', 'soft', 'high-contrast'));

grant update (
  name, locale, status, updated_at, avatar_path, bio, job_title, phone,
  location, website, accent_color, interface_filter, color_vision_mode
) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'prismivo-avatars',
  'prismivo-avatars',
  false,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy prismivo_avatars_select_own on storage.objects
for select to authenticated
using (
  bucket_id = 'prismivo-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy prismivo_avatars_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'prismivo-avatars'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy prismivo_avatars_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'prismivo-avatars'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'prismivo-avatars'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy prismivo_avatars_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id = 'prismivo-avatars'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

alter table public.profiles
  add column sidebar_mode text not null default 'adaptive',
  add column interface_density text not null default 'comfortable',
  add column content_width text not null default 'standard',
  add column corner_style text not null default 'rounded',
  add column text_scale text not null default 'default',
  add column motion_mode text not null default 'system',
  add column primary_navigation text[] not null default array['dashboard', 'tasks', 'projects', 'clients']::text[];

alter table public.profiles
  add constraint profiles_sidebar_mode_valid
    check (sidebar_mode in ('adaptive', 'light', 'dark', 'brand')),
  add constraint profiles_interface_density_valid
    check (interface_density in ('compact', 'comfortable', 'spacious')),
  add constraint profiles_content_width_valid
    check (content_width in ('focused', 'standard', 'wide')),
  add constraint profiles_corner_style_valid
    check (corner_style in ('soft', 'rounded', 'square')),
  add constraint profiles_text_scale_valid
    check (text_scale in ('default', 'large', 'extra-large')),
  add constraint profiles_motion_mode_valid
    check (motion_mode in ('system', 'full', 'reduced')),
  add constraint profiles_primary_navigation_valid
    check (
      cardinality(primary_navigation) = 4
      and array_position(primary_navigation, null) is null
      and primary_navigation <@ array[
        'dashboard', 'tasks', 'projects', 'clients', 'approvals',
        'files', 'support', 'content', 'notifications', 'settings'
      ]::text[]
      and primary_navigation[1] <> primary_navigation[2]
      and primary_navigation[1] <> primary_navigation[3]
      and primary_navigation[1] <> primary_navigation[4]
      and primary_navigation[2] <> primary_navigation[3]
      and primary_navigation[2] <> primary_navigation[4]
      and primary_navigation[3] <> primary_navigation[4]
    );

grant update (
  sidebar_mode,
  interface_density,
  content_width,
  corner_style,
  text_scale,
  motion_mode,
  primary_navigation
) on public.profiles to authenticated;

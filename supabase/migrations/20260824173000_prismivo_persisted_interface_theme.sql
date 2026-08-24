-- Marco 21 — preferências de aparência só entram em vigor depois de salvas.

alter table public.profiles
  add column theme text not null default 'system';

alter table public.profiles
  add constraint profiles_theme_valid
  check (theme in ('system', 'light', 'dark', 'mono'));

grant update (theme) on public.profiles to authenticated;

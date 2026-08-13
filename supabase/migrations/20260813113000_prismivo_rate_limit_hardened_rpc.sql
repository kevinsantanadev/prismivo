-- Marco 21 — rate limiting funcional sem credencial administrativa no runtime.
--
-- O servidor transforma o identificador em SHA-256 usando um pepper privado antes
-- de chamar esta função. A função aceita somente buckets conhecidos e hashes com
-- 64 caracteres hexadecimais; não recebe nem armazena e-mail, IP ou senha.

alter table private.rate_limit_windows enable row level security;

revoke all on table private.rate_limit_windows from public, anon, authenticated;

revoke all on function public.consume_rate_limit(text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.consume_rate_limit(text, text)
  to anon, authenticated;

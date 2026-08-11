-- Marco 11 — manutenção automática das janelas expiradas de rate limiting.

create or replace function public.consume_rate_limit(
  target_bucket text,
  target_subject_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  limit_count integer;
  window_seconds integer;
  current_window timestamptz;
  current_count integer;
  reset_at timestamptz;
begin
  select config.max_requests, config.seconds
    into limit_count, window_seconds
  from (values
    ('auth.login'::text, 8, 300),
    ('auth.signup'::text, 4, 900),
    ('auth.recovery'::text, 4, 900)
  ) as config(bucket, max_requests, seconds)
  where config.bucket = target_bucket;

  if limit_count is null or target_subject_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'INVALID_RATE_LIMIT_INPUT' using errcode = '22023';
  end if;

  current_window := to_timestamp(
    floor(extract(epoch from now()) / window_seconds) * window_seconds
  );
  reset_at := current_window + make_interval(secs => window_seconds);

  delete from private.rate_limit_windows where expires_at < now();

  insert into private.rate_limit_windows(
    bucket, subject_hash, window_started_at, request_count, expires_at
  ) values (
    target_bucket, target_subject_hash, current_window, 1, reset_at + interval '60 seconds'
  )
  on conflict (bucket, subject_hash, window_started_at)
  do update set request_count = private.rate_limit_windows.request_count + 1
  returning request_count into current_count;

  return jsonb_build_object(
    'allowed', current_count <= limit_count,
    'remaining', greatest(limit_count - current_count, 0),
    'resetAt', reset_at
  );
end;
$$;

revoke all on function public.consume_rate_limit(text, text) from public;
grant execute on function public.consume_rate_limit(text, text) to anon, authenticated;

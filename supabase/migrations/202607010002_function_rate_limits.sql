create table if not exists public.function_rate_limits (
  endpoint text not null,
  identifier_hash text not null,
  window_start timestamptz not null,
  count integer not null default 1 check (count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (endpoint, identifier_hash, window_start)
);

alter table public.function_rate_limits enable row level security;
revoke all on public.function_rate_limits from anon, authenticated;
grant select, insert, update, delete on public.function_rate_limits to service_role;

create index if not exists function_rate_limits_cleanup_idx
on public.function_rate_limits (window_start);

create or replace function public.hit_function_rate_limit(
  p_endpoint text,
  p_identifier_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  if p_endpoint is null or p_endpoint = '' then
    raise exception 'endpoint required';
  end if;
  if p_identifier_hash is null or p_identifier_hash = '' then
    raise exception 'identifier required';
  end if;
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate limit';
  end if;

  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.function_rate_limits(endpoint, identifier_hash, window_start, count)
  values (p_endpoint, p_identifier_hash, v_window_start, 1)
  on conflict (endpoint, identifier_hash, window_start)
  do update set count = public.function_rate_limits.count + 1, updated_at = now()
  returning count into v_count;

  delete from public.function_rate_limits
  where window_start < now() - interval '2 hours';

  return v_count > p_limit;
end;
$$;

grant execute on function public.hit_function_rate_limit(text, text, integer, integer) to service_role;

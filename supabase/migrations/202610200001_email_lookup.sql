-- Execute no SQL Editor do projeto AutoLog. Não publica a lista de usuários.
begin;
create schema if not exists autolog_private;
revoke all on schema autolog_private from public, anon, authenticated;
create table if not exists autolog_private.email_lookup_limits (
  client_hash text primary key,
  window_start timestamptz not null,
  attempts integer not null
);
alter table autolog_private.email_lookup_limits enable row level security;
revoke all on autolog_private.email_lookup_limits from public, anon, authenticated;

create or replace function public.autolog_check_email(p_email text, p_client_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_attempts integer;
  v_exists boolean;
begin
  if v_email is null or length(v_email) > 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_client_hash is null or p_client_hash !~ '^[a-f0-9]{64}$' then
    return jsonb_build_object('error', 'invalid_request');
  end if;
  insert into autolog_private.email_lookup_limits as limits (client_hash, window_start, attempts)
  values (p_client_hash, now(), 1)
  on conflict (client_hash) do update set
    attempts = case when limits.window_start < now() - interval '15 minutes' then 1 else limits.attempts + 1 end,
    window_start = case when limits.window_start < now() - interval '15 minutes' then now() else limits.window_start end
  returning attempts into v_attempts;
  if v_attempts > 30 then return jsonb_build_object('error', 'rate_limited'); end if;
  delete from autolog_private.email_lookup_limits where window_start < now() - interval '1 day';
  select exists(select 1 from auth.users where lower(email) = v_email and deleted_at is null) into v_exists;
  return jsonb_build_object('exists', v_exists);
end;
$$;
revoke all on function public.autolog_check_email(text, text) from public, anon, authenticated;
grant execute on function public.autolog_check_email(text, text) to service_role;
commit;

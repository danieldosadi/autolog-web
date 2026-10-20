create table if not exists public.autolog_vehicles (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null check (length(id) between 1 and 200),
  payload jsonb,
  deleted boolean not null default false,
  primary key (user_id, id),
  check (deleted or (jsonb_typeof(payload) = 'object' and payload->>'id' = id))
);
alter table public.autolog_vehicles enable row level security;
revoke all on public.autolog_vehicles from anon;
grant select, insert, update on public.autolog_vehicles to authenticated;
create policy "Own vehicles select" on public.autolog_vehicles for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own vehicles insert" on public.autolog_vehicles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Own vehicles update" on public.autolog_vehicles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

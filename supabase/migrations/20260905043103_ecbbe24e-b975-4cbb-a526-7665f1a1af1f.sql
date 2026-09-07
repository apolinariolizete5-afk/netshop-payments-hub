alter table public.app_settings enable row level security;
grant select on public.app_settings to anon, authenticated;
drop policy if exists "app_settings public read" on public.app_settings;
create policy "app_settings public read" on public.app_settings for select to anon, authenticated using (true);

alter table public.cv_purchases enable row level security;
grant select, insert, update on public.cv_purchases to authenticated;
drop policy if exists "own purchases select" on public.cv_purchases;
create policy "own purchases select" on public.cv_purchases for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own purchases insert" on public.cv_purchases;
create policy "own purchases insert" on public.cv_purchases for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "own purchases update" on public.cv_purchases;
create policy "own purchases update" on public.cv_purchases for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.netshop_apply_payment(
  _reference text,
  _status text,
  _method text default null,
  _provider_id text default null
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _updated int;
begin
  if _status not in ('paid','failed') then
    return false;
  end if;

  update public.cv_purchases
     set status = _status,
         method = coalesce(_method, method),
         provider_id = coalesce(_provider_id, provider_id),
         paid_at = case when _status = 'paid' then coalesce(paid_at, now()) else paid_at end
   where reference = _reference
     and status = 'pending';

  get diagnostics _updated = row_count;
  return _updated > 0;
end;
$$;

revoke all on function public.netshop_apply_payment(text,text,text,text) from public;
grant execute on function public.netshop_apply_payment(text,text,text,text) to anon, authenticated, service_role;
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.can_manage_athlete(target_athlete_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    and exists (
      select 1
      from public.athletes
      where id = target_athlete_id
        and managed_by = auth.uid()
    );
$$;

drop policy if exists "admins can create athletes" on public.athletes;
create policy "admins can create athletes"
on public.athletes
for insert
with check (
  public.is_admin()
  and managed_by = auth.uid()
);

drop policy if exists "admins can view managed athletes" on public.athletes;
create policy "admins can view managed athletes"
on public.athletes
for select
using (public.can_access_athlete(id));

drop policy if exists "admins can update managed athletes" on public.athletes;
create policy "admins can update managed athletes"
on public.athletes
for update
using (public.can_manage_athlete(id))
with check (public.can_manage_athlete(id));

create or replace function public.can_manage_athlete(target_athlete_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.athletes
    where id = target_athlete_id
      and managed_by = auth.uid()
      and public.is_admin()
  );
$$;

revoke all on function public.can_manage_athlete(uuid) from public;
grant execute on function public.can_manage_athlete(uuid) to authenticated;

create or replace function public.can_access_athlete(target_athlete_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.athletes
      where id = target_athlete_id
        and managed_by = auth.uid()
        and public.is_admin()
    )
    or public.is_active_athlete_login(target_athlete_id)
    or exists (
      select 1
      from public.parent_athletes
      where athlete_id = target_athlete_id
        and parent_user_id = auth.uid()
    );
$$;

revoke all on function public.can_access_athlete(uuid) from public;
grant execute on function public.can_access_athlete(uuid) to authenticated;

drop policy if exists "admins can view managed athletes" on public.athletes;
create policy "admins can view managed athletes"
on public.athletes
for select
using (
  (
    public.is_admin()
    and managed_by = auth.uid()
  )
  or public.is_active_athlete_login(id)
  or exists (
    select 1
    from public.parent_athletes
    where athlete_id = id
      and parent_user_id = auth.uid()
  )
);

drop policy if exists "admins can update managed athletes" on public.athletes;
create policy "admins can update managed athletes"
on public.athletes
for update
using (
  public.is_admin()
  and managed_by = auth.uid()
)
with check (
  public.is_admin()
  and managed_by = auth.uid()
);

create type public.athlete_login_status as enum ('none', 'invited', 'connected', 'disabled');

alter table public.athletes
  add column athlete_login_status public.athlete_login_status not null default 'none',
  add column login_email text,
  add column invited_at timestamptz,
  add column connected_at timestamptz,
  add column disabled_at timestamptz;

update public.athletes
set athlete_login_status = 'none'
where user_id is null;

update public.athletes a
set
  athlete_login_status = 'connected',
  login_email = coalesce(u.email, a.login_email),
  connected_at = coalesce(a.connected_at, a.updated_at, a.created_at),
  invited_at = null,
  disabled_at = null
from auth.users u
where a.user_id = u.id;

alter table public.athletes
  add constraint athletes_login_state_requires_user
  check (
    (athlete_login_status = 'none' and user_id is null)
    or (athlete_login_status <> 'none' and user_id is not null)
  );

create unique index athletes_login_email_unique_idx
on public.athletes (lower(login_email))
where athlete_login_status <> 'none'
  and login_email is not null;

create index athletes_managed_login_status_idx
on public.athletes (managed_by, athlete_login_status);

create or replace function public.is_active_athlete_login(target_athlete_id uuid)
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
      and user_id = auth.uid()
      and athlete_login_status in ('invited', 'connected')
      and disabled_at is null
      and public.current_user_role() = 'athlete'
  );
$$;

create or replace function public.can_access_athlete(target_athlete_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.can_manage_athlete(target_athlete_id)
    or public.is_active_athlete_login(target_athlete_id)
    or exists (
      select 1
      from public.parent_athletes
      where athlete_id = target_athlete_id
        and parent_user_id = auth.uid()
    );
$$;

create or replace function public.is_self_athlete(target_athlete_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_athlete_login(target_athlete_id);
$$;

drop policy if exists "admins can update training days" on public.training_days;
create policy "admins can update training days"
on public.training_days
for update
using (
  public.can_manage_athlete(athlete_id)
  or public.is_active_athlete_login(athlete_id)
)
with check (
  public.can_manage_athlete(athlete_id)
  or public.is_active_athlete_login(athlete_id)
);

drop policy if exists "athletes and admins can insert exercise results" on public.exercise_results;
create policy "athletes and admins can insert exercise results"
on public.exercise_results
for insert
with check (
  public.can_manage_athlete(athlete_id)
  or public.is_active_athlete_login(athlete_id)
);

drop policy if exists "athletes and admins can update exercise results" on public.exercise_results;
create policy "athletes and admins can update exercise results"
on public.exercise_results
for update
using (
  public.can_manage_athlete(athlete_id)
  or public.is_active_athlete_login(athlete_id)
)
with check (
  public.can_manage_athlete(athlete_id)
  or public.is_active_athlete_login(athlete_id)
);

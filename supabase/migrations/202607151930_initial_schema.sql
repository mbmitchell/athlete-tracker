create extension if not exists "pgcrypto";

create type public.app_role as enum ('admin', 'athlete', 'parent');
create type public.readiness_status as enum ('ready', 'monitor', 'recover');
create type public.completion_status as enum ('not_started', 'in_progress', 'completed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.app_role not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.athletes (
  id uuid primary key default gen_random_uuid(),
  managed_by uuid not null references public.user_profiles(id) on delete cascade,
  user_id uuid unique references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  graduation_year integer not null,
  date_of_birth date,
  hometown text not null,
  primary_position text not null,
  secondary_position text,
  height text,
  weight text,
  current_team text,
  development_goals text[] not null default '{}',
  available_equipment text[] not null default '{}',
  restrictions_or_injury_notes text,
  recruiting_notes text,
  current_development_focus text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.parent_athletes (
  parent_user_id uuid not null references public.user_profiles(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (parent_user_id, athlete_id)
);

create table public.training_weeks (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  week_start_date date not null,
  focus text,
  notes text,
  created_by uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (athlete_id, week_start_date)
);

create table public.training_days (
  id uuid primary key default gen_random_uuid(),
  training_week_id uuid references public.training_weeks(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  training_date date not null,
  session_title text not null,
  objective text,
  estimated_duration_minutes integer,
  completion_status public.completion_status not null default 'not_started',
  athlete_notes text,
  coach_notes text,
  created_by uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (athlete_id, training_date)
);

create table public.workout_sections (
  id uuid primary key default gen_random_uuid(),
  training_day_id uuid not null references public.training_days(id) on delete cascade,
  sort_order integer not null default 0,
  title text not null,
  objective text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_section_id uuid not null references public.workout_sections(id) on delete cascade,
  sort_order integer not null default 0,
  title text not null,
  instructions text,
  prescribed_sets integer,
  prescribed_reps text,
  prescribed_weight text,
  prescribed_distance text,
  prescribed_duration text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.exercise_checklist_items (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  sort_order integer not null default 0,
  label text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.exercise_results (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  actual_sets integer,
  actual_reps text,
  actual_weight text,
  actual_distance text,
  actual_duration text,
  completed boolean not null default false,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workout_exercise_id, athlete_id)
);

create table public.athlete_readiness_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  readiness_status public.readiness_status not null,
  body_weight numeric(6, 2),
  development_focus text,
  notes text,
  recorded_at timestamptz not null default timezone('utc', now())
);

create index athletes_managed_by_idx on public.athletes (managed_by);
create index athletes_user_id_idx on public.athletes (user_id);
create index parent_athletes_athlete_id_idx on public.parent_athletes (athlete_id);
create index training_days_athlete_date_idx on public.training_days (athlete_id, training_date);
create index readiness_athlete_recorded_at_idx on public.athlete_readiness_logs (athlete_id, recorded_at desc);

create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

create trigger set_athletes_updated_at
before update on public.athletes
for each row
execute function public.set_updated_at();

create trigger set_training_weeks_updated_at
before update on public.training_weeks
for each row
execute function public.set_updated_at();

create trigger set_training_days_updated_at
before update on public.training_days
for each row
execute function public.set_updated_at();

create trigger set_exercise_results_updated_at
before update on public.exercise_results
for each row
execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.user_profiles
  where id = auth.uid();
$$;

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
      and public.current_user_role() = 'admin'
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
    or exists (
      select 1
      from public.athletes
      where id = target_athlete_id
        and user_id = auth.uid()
    )
    or exists (
      select 1
      from public.parent_athletes
      where athlete_id = target_athlete_id
        and parent_user_id = auth.uid()
    );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inferred_role public.app_role;
begin
  inferred_role :=
    case coalesce(new.raw_user_meta_data ->> 'role', '')
      when 'admin' then 'admin'::public.app_role
      when 'parent' then 'parent'::public.app_role
      else 'athlete'::public.app_role
    end;

  insert into public.user_profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    inferred_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.user_profiles enable row level security;
alter table public.athletes enable row level security;
alter table public.parent_athletes enable row level security;
alter table public.training_weeks enable row level security;
alter table public.training_days enable row level security;
alter table public.workout_sections enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.exercise_checklist_items enable row level security;
alter table public.exercise_results enable row level security;
alter table public.athlete_readiness_logs enable row level security;

create policy "users can view their own profile"
on public.user_profiles
for select
using (id = auth.uid());

create policy "users can update their own profile"
on public.user_profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "admins can view managed athletes"
on public.athletes
for select
using (public.can_access_athlete(id));

create policy "admins can create athletes"
on public.athletes
for insert
with check (
  public.current_user_role() = 'admin'
  and managed_by = auth.uid()
);

create policy "admins can update managed athletes"
on public.athletes
for update
using (public.can_manage_athlete(id))
with check (public.can_manage_athlete(id));

create policy "admins can view parent links for managed athletes"
on public.parent_athletes
for select
using (
  parent_user_id = auth.uid()
  or public.can_manage_athlete(athlete_id)
);

create policy "admins can create parent links"
on public.parent_athletes
for insert
with check (
  public.current_user_role() = 'admin'
  and public.can_manage_athlete(athlete_id)
);

create policy "admins can delete parent links"
on public.parent_athletes
for delete
using (
  public.current_user_role() = 'admin'
  and public.can_manage_athlete(athlete_id)
);

create policy "authorized users can view training weeks"
on public.training_weeks
for select
using (public.can_access_athlete(athlete_id));

create policy "admins can manage training weeks"
on public.training_weeks
for all
using (public.can_manage_athlete(athlete_id))
with check (
  public.current_user_role() = 'admin'
  and public.can_manage_athlete(athlete_id)
);

create policy "authorized users can view training days"
on public.training_days
for select
using (public.can_access_athlete(athlete_id));

create policy "admins can create training days"
on public.training_days
for insert
with check (
  public.current_user_role() = 'admin'
  and public.can_manage_athlete(athlete_id)
);

create policy "admins can update training days"
on public.training_days
for update
using (
  public.can_manage_athlete(athlete_id)
  or exists (
    select 1
    from public.athletes
    where id = athlete_id
      and user_id = auth.uid()
  )
)
with check (
  public.can_manage_athlete(athlete_id)
  or exists (
    select 1
    from public.athletes
    where id = athlete_id
      and user_id = auth.uid()
  )
);

create policy "admins can delete training days"
on public.training_days
for delete
using (public.can_manage_athlete(athlete_id));

create policy "authorized users can view workout sections"
on public.workout_sections
for select
using (
  exists (
    select 1
    from public.training_days
    where id = training_day_id
      and public.can_access_athlete(athlete_id)
  )
);

create policy "admins can manage workout sections"
on public.workout_sections
for all
using (
  exists (
    select 1
    from public.training_days
    where id = training_day_id
      and public.can_manage_athlete(athlete_id)
  )
)
with check (
  exists (
    select 1
    from public.training_days
    where id = training_day_id
      and public.can_manage_athlete(athlete_id)
  )
);

create policy "authorized users can view workout exercises"
on public.workout_exercises
for select
using (
  exists (
    select 1
    from public.workout_sections ws
    join public.training_days td on td.id = ws.training_day_id
    where ws.id = workout_section_id
      and public.can_access_athlete(td.athlete_id)
  )
);

create policy "admins can manage workout exercises"
on public.workout_exercises
for all
using (
  exists (
    select 1
    from public.workout_sections ws
    join public.training_days td on td.id = ws.training_day_id
    where ws.id = workout_section_id
      and public.can_manage_athlete(td.athlete_id)
  )
)
with check (
  exists (
    select 1
    from public.workout_sections ws
    join public.training_days td on td.id = ws.training_day_id
    where ws.id = workout_section_id
      and public.can_manage_athlete(td.athlete_id)
  )
);

create policy "authorized users can view checklist items"
on public.exercise_checklist_items
for select
using (
  exists (
    select 1
    from public.workout_exercises we
    join public.workout_sections ws on ws.id = we.workout_section_id
    join public.training_days td on td.id = ws.training_day_id
    where we.id = workout_exercise_id
      and public.can_access_athlete(td.athlete_id)
  )
);

create policy "admins can manage checklist items"
on public.exercise_checklist_items
for all
using (
  exists (
    select 1
    from public.workout_exercises we
    join public.workout_sections ws on ws.id = we.workout_section_id
    join public.training_days td on td.id = ws.training_day_id
    where we.id = workout_exercise_id
      and public.can_manage_athlete(td.athlete_id)
  )
)
with check (
  exists (
    select 1
    from public.workout_exercises we
    join public.workout_sections ws on ws.id = we.workout_section_id
    join public.training_days td on td.id = ws.training_day_id
    where we.id = workout_exercise_id
      and public.can_manage_athlete(td.athlete_id)
  )
);

create policy "authorized users can view exercise results"
on public.exercise_results
for select
using (public.can_access_athlete(athlete_id));

create policy "athletes and admins can insert exercise results"
on public.exercise_results
for insert
with check (
  public.can_manage_athlete(athlete_id)
  or exists (
    select 1
    from public.athletes
    where id = athlete_id
      and user_id = auth.uid()
  )
);

create policy "athletes and admins can update exercise results"
on public.exercise_results
for update
using (
  public.can_manage_athlete(athlete_id)
  or exists (
    select 1
    from public.athletes
    where id = athlete_id
      and user_id = auth.uid()
  )
)
with check (
  public.can_manage_athlete(athlete_id)
  or exists (
    select 1
    from public.athletes
    where id = athlete_id
      and user_id = auth.uid()
  )
);

create policy "authorized users can view readiness logs"
on public.athlete_readiness_logs
for select
using (public.can_access_athlete(athlete_id));

create policy "admins can manage readiness logs"
on public.athlete_readiness_logs
for all
using (public.can_manage_athlete(athlete_id))
with check (
  public.current_user_role() = 'admin'
  and public.can_manage_athlete(athlete_id)
);

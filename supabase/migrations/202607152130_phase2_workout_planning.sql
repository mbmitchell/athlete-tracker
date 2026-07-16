create type public.exercise_category as enum (
  'readiness',
  'warm_up',
  'mobility',
  'strength',
  'power',
  'speed',
  'agility',
  'hitting',
  'throwing',
  'catching',
  'defense',
  'pitching',
  'recovery',
  'nutrition',
  'recruiting',
  'custom'
);

create type public.workout_result_type as enum (
  'checkbox',
  'sets_reps',
  'sets_reps_weight',
  'duration',
  'distance',
  'velocity',
  'count',
  'text',
  'numeric',
  'percentage',
  'rating'
);

create type public.training_week_status as enum ('draft', 'published', 'archived');
create type public.assigned_workout_status as enum ('draft', 'published', 'in_progress', 'completed', 'skipped');

alter table public.training_weeks rename column notes to admin_notes;
alter table public.training_weeks add column title text not null default 'Training Week';
alter table public.training_weeks add column status public.training_week_status not null default 'draft';

alter table public.athlete_readiness_logs
  add column sleep_hours numeric(4,1),
  add column sleep_quality integer,
  add column energy integer,
  add column soreness integer,
  add column stress integer,
  add column entered_by uuid references public.user_profiles(id) on delete set null;

alter table public.athlete_readiness_logs
  alter column readiness_status set default 'ready';

alter table public.athlete_readiness_logs
  add constraint athlete_readiness_logs_sleep_quality_check check (sleep_quality is null or sleep_quality between 1 and 5),
  add constraint athlete_readiness_logs_energy_check check (energy is null or energy between 1 and 5),
  add constraint athlete_readiness_logs_soreness_check check (soreness is null or soreness between 1 and 5),
  add constraint athlete_readiness_logs_stress_check check (stress is null or stress between 1 and 5);

create table public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.user_profiles(id) on delete cascade,
  name text not null,
  category public.exercise_category not null,
  description text,
  coaching_cues text,
  default_unit_type public.workout_result_type not null,
  equipment text,
  video_url text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.user_profiles(id) on delete cascade,
  name text not null,
  description text,
  estimated_duration_minutes integer,
  focus text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.workout_template_sections (
  id uuid primary key default gen_random_uuid(),
  workout_template_id uuid not null references public.workout_templates(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 0
);

create table public.workout_template_items (
  id uuid primary key default gen_random_uuid(),
  workout_template_section_id uuid not null references public.workout_template_sections(id) on delete cascade,
  exercise_id uuid references public.exercise_library(id) on delete set null,
  custom_name text,
  instructions text,
  prescribed_sets text,
  prescribed_reps text,
  prescribed_load text,
  prescribed_duration_seconds integer,
  prescribed_distance text,
  prescribed_unit text,
  target_value text,
  target_unit text,
  rest_seconds integer,
  sort_order integer not null default 0,
  required boolean not null default true,
  result_entry_type public.workout_result_type not null,
  notes text
);

create table public.assigned_workouts (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  training_week_id uuid references public.training_weeks(id) on delete set null,
  source_template_id uuid references public.workout_templates(id) on delete set null,
  workout_date date not null,
  title text not null,
  objective text,
  estimated_duration_minutes integer,
  status public.assigned_workout_status not null default 'draft',
  admin_notes text,
  athlete_notes text,
  skip_reason text,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (athlete_id, workout_date)
);

create table public.assigned_workout_sections (
  id uuid primary key default gen_random_uuid(),
  assigned_workout_id uuid not null references public.assigned_workouts(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 0
);

create table public.assigned_workout_items (
  id uuid primary key default gen_random_uuid(),
  assigned_workout_section_id uuid not null references public.assigned_workout_sections(id) on delete cascade,
  source_exercise_id uuid references public.exercise_library(id) on delete set null,
  name text not null,
  instructions text,
  prescribed_sets text,
  prescribed_reps text,
  prescribed_load text,
  prescribed_duration_seconds integer,
  prescribed_distance text,
  prescribed_unit text,
  target_value text,
  target_unit text,
  rest_seconds integer,
  sort_order integer not null default 0,
  required boolean not null default true,
  result_entry_type public.workout_result_type not null
);

create table public.workout_item_results (
  id uuid primary key default gen_random_uuid(),
  assigned_workout_item_id uuid not null references public.assigned_workout_items(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  completed boolean not null default false,
  actual_sets text,
  actual_reps text,
  actual_load text,
  actual_duration_seconds text,
  actual_distance text,
  actual_value text,
  actual_unit text,
  rating integer,
  text_result text,
  athlete_notes text,
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (assigned_workout_item_id, athlete_id)
);

alter table public.athlete_readiness_logs
  add column assigned_workout_id uuid references public.assigned_workouts(id) on delete set null;

alter table public.exercise_library
  add constraint exercise_library_owner_name_unique unique (owner_user_id, name);

alter table public.workout_templates
  add constraint workout_templates_owner_name_unique unique (owner_user_id, name);

create index workout_templates_owner_idx on public.workout_templates (owner_user_id, active);
create index assigned_workouts_athlete_date_idx on public.assigned_workouts (athlete_id, workout_date);
create index assigned_workouts_training_week_idx on public.assigned_workouts (training_week_id, workout_date);
create index assigned_workout_sections_workout_idx on public.assigned_workout_sections (assigned_workout_id, sort_order);
create index assigned_workout_items_section_idx on public.assigned_workout_items (assigned_workout_section_id, sort_order);
create index workout_item_results_athlete_idx on public.workout_item_results (athlete_id);

alter table public.athlete_readiness_logs
  add constraint athlete_readiness_workout_unique unique (athlete_id, assigned_workout_id);

create trigger set_exercise_library_updated_at
before update on public.exercise_library
for each row
execute function public.set_updated_at();

create trigger set_workout_templates_updated_at
before update on public.workout_templates
for each row
execute function public.set_updated_at();

create trigger set_assigned_workouts_updated_at
before update on public.assigned_workouts
for each row
execute function public.set_updated_at();

create or replace function public.is_admin_owner(target_owner_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin' and auth.uid() = target_owner_user_id;
$$;

create or replace function public.is_self_athlete(target_athlete_id uuid)
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
      and public.current_user_role() = 'athlete'
  );
$$;

create or replace function public.is_parent_linked(target_athlete_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.parent_athletes
    where athlete_id = target_athlete_id
      and parent_user_id = auth.uid()
      and public.current_user_role() = 'parent'
  );
$$;

create or replace function public.can_view_workout_for_athlete(
  target_athlete_id uuid,
  target_status public.assigned_workout_status
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.can_manage_athlete(target_athlete_id)
    or (
      target_status <> 'draft'
      and (public.is_self_athlete(target_athlete_id) or public.is_parent_linked(target_athlete_id))
    );
$$;

create or replace function public.can_edit_workout_progress_for_athlete(target_athlete_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_self_athlete(target_athlete_id);
$$;

create or replace function public.assigned_workout_item_belongs_to_athlete(
  target_item_id uuid,
  target_athlete_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.assigned_workout_items awi
    join public.assigned_workout_sections aws on aws.id = awi.assigned_workout_section_id
    join public.assigned_workouts aw on aw.id = aws.assigned_workout_id
    where awi.id = target_item_id
      and aw.athlete_id = target_athlete_id
  );
$$;

create or replace function public.guard_assigned_workout_athlete_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() = 'athlete' then
    if not public.is_self_athlete(old.athlete_id) then
      raise exception 'Athletes may only update their own workouts.';
    end if;

    if new.athlete_id <> old.athlete_id
      or new.training_week_id is distinct from old.training_week_id
      or new.source_template_id is distinct from old.source_template_id
      or new.workout_date <> old.workout_date
      or new.title is distinct from old.title
      or new.objective is distinct from old.objective
      or new.estimated_duration_minutes is distinct from old.estimated_duration_minutes
      or new.admin_notes is distinct from old.admin_notes
      or new.skip_reason is distinct from old.skip_reason
      or new.created_by <> old.created_by
      or new.created_at <> old.created_at then
      raise exception 'Athletes may not change workout prescriptions or admin metadata.';
    end if;

    if new.status not in ('in_progress', 'completed') then
      raise exception 'Athletes may only move workouts to in_progress or completed.';
    end if;

    if old.status = 'completed' and new.status <> 'completed' then
      raise exception 'Completed workouts may only be deliberately edited while staying completed.';
    end if;
  end if;

  return new;
end;
$$;

create trigger guard_assigned_workout_athlete_updates
before update on public.assigned_workouts
for each row
execute function public.guard_assigned_workout_athlete_updates();

create or replace function public.seed_baseball_starter_data(target_owner_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  catcher_template_id uuid;
  outfield_template_id uuid;
  section_prep_id uuid;
  section_power_id uuid;
  section_speed_id uuid;
  section_hitting_id uuid;
begin
  if not public.is_admin_owner(target_owner_user_id) then
    raise exception 'Only the owning admin may seed starter data.';
  end if;

  insert into public.exercise_library (
    owner_user_id, name, category, description, coaching_cues, default_unit_type, equipment, active
  ) values
    (target_owner_user_id, 'Readiness questionnaire', 'readiness', 'Daily self-report before training.', 'Answer honestly before the warm-up starts.', 'rating', 'None', true),
    (target_owner_user_id, 'Dynamic warm-up', 'warm_up', 'Foundational movement prep for practice or training.', 'Own each position and keep the pace controlled.', 'duration', 'Open space', true),
    (target_owner_user_id, 'Med-ball scoop toss', 'power', 'Build rotational force transfer.', 'Load the back hip and finish through the wall.', 'sets_reps', 'Med ball', true),
    (target_owner_user_id, 'Tee exit-velocity swings', 'hitting', 'Intent-based swings tracked for peak exit velocity.', 'Attack the middle of the ball with intent, not overswing.', 'velocity', 'Bat, tee, pocket radar', true),
    (target_owner_user_id, 'Blast Motion measured swings', 'hitting', 'Sensor-based swing tracking.', 'Stay consistent so the sensor data stays clean.', 'numeric', 'Blast Motion sensor', true),
    (target_owner_user_id, 'Catcher receiving', 'catching', 'Receiving and pocket presentation reps.', 'Beat the ball to the spot and hold the pocket quietly.', 'count', 'Catching gear', true),
    (target_owner_user_id, 'Timed catcher throws', 'catching', 'Pop time and transfer work.', 'Feet first, then clean hand exchange.', 'duration', 'Stopwatch', true),
    (target_owner_user_id, 'Plyoball routine', 'throwing', 'Arm-care and patterning sequence.', 'Stay crisp and stop before mechanics fade.', 'checkbox', 'Plyoballs', true),
    (target_owner_user_id, 'Bullpen', 'pitching', 'Structured mound session.', 'Compete through the glove side without rushing down the mound.', 'count', 'Mound', true),
    (target_owner_user_id, 'Trap-bar deadlift', 'strength', 'Primary lower-body strength pattern.', 'Brace, push the floor away, and finish tall.', 'sets_reps_weight', 'Trap bar', true),
    (target_owner_user_id, 'Bulgarian split squat', 'strength', 'Single-leg force and control.', 'Own the bottom position and drive straight up.', 'sets_reps_weight', 'Dumbbells', true),
    (target_owner_user_id, 'Cable rotation', 'power', 'Rotational force and trunk control.', 'Turn around a stable front hip.', 'sets_reps_weight', 'Cable machine', true),
    (target_owner_user_id, 'Sprint work', 'speed', 'Acceleration or max-velocity sprint prescription.', 'Project with intent and keep your rhythm clean.', 'distance', 'Turf', true),
    (target_owner_user_id, 'Recovery breathing', 'recovery', 'Down-regulation and recovery routine.', 'Exhale long and let the rib cage drop.', 'duration', 'None', true)
  on conflict (owner_user_id, name) do update
  set
    category = excluded.category,
    description = excluded.description,
    coaching_cues = excluded.coaching_cues,
    default_unit_type = excluded.default_unit_type,
    equipment = excluded.equipment,
    active = true;

  select id into catcher_template_id
  from public.workout_templates
  where owner_user_id = target_owner_user_id
    and name = 'Catcher Power + Throw Transfer';

  if catcher_template_id is null then
    insert into public.workout_templates (
      owner_user_id, name, description, estimated_duration_minutes, focus, active
    ) values (
      target_owner_user_id,
      'Catcher Power + Throw Transfer',
      'Lower-body force, rotational power, and transfer speed work.',
      75,
      'Explosive force and catcher transfer speed',
      true
    )
    returning id into catcher_template_id;

    insert into public.workout_template_sections (workout_template_id, title, description, sort_order)
    values
      (catcher_template_id, 'Prep', 'Get hips, trunk, and shoulders ready to move fast.', 1),
      (catcher_template_id, 'Power + skill', 'Pair explosive work with transfer-speed skill work.', 2);

    select id into section_prep_id
    from public.workout_template_sections
    where workout_template_id = catcher_template_id and sort_order = 1;

    select id into section_power_id
    from public.workout_template_sections
    where workout_template_id = catcher_template_id and sort_order = 2;

    insert into public.workout_template_items (
      workout_template_section_id, exercise_id, instructions, prescribed_duration_seconds,
      prescribed_unit, sort_order, required, result_entry_type
    )
    values (
      section_prep_id,
      (select id from public.exercise_library where owner_user_id = target_owner_user_id and lower(name) = lower('Dynamic warm-up')),
      'Flow through each movement without rushing.',
      600,
      'seconds',
      1,
      true,
      'checkbox'
    );

    insert into public.workout_template_items (
      workout_template_section_id, exercise_id, instructions, prescribed_sets, prescribed_reps,
      prescribed_load, rest_seconds, sort_order, required, result_entry_type
    )
    values
      (
        section_power_id,
        (select id from public.exercise_library where owner_user_id = target_owner_user_id and lower(name) = lower('Med-ball scoop toss')),
        'Throw into the wall with max intent and full reset between reps.',
        '4',
        '4 / side',
        '6 lb',
        75,
        1,
        true,
        'sets_reps_weight'
      ),
      (
        section_power_id,
        (select id from public.exercise_library where owner_user_id = target_owner_user_id and lower(name) = lower('Timed catcher throws')),
        'Record your best rep and your average pop time.',
        '5',
        '2 throws',
        null,
        60,
        2,
        true,
        'duration'
      );
  end if;

  select id into outfield_template_id
  from public.workout_templates
  where owner_user_id = target_owner_user_id
    and name = 'Outfield Speed + Exit Velo';

  if outfield_template_id is null then
    insert into public.workout_templates (
      owner_user_id, name, description, estimated_duration_minutes, focus, active
    ) values (
      target_owner_user_id,
      'Outfield Speed + Exit Velo',
      'Speed, rotational intent, and measured swing quality.',
      70,
      'Acceleration and batted-ball quality',
      true
    )
    returning id into outfield_template_id;

    insert into public.workout_template_sections (workout_template_id, title, description, sort_order)
    values
      (outfield_template_id, 'Movement prep', 'Prime sprint posture and bat speed.', 1),
      (outfield_template_id, 'Speed + hitting', 'Keep the day fast without excess volume.', 2);

    select id into section_speed_id
    from public.workout_template_sections
    where workout_template_id = outfield_template_id and sort_order = 1;

    select id into section_hitting_id
    from public.workout_template_sections
    where workout_template_id = outfield_template_id and sort_order = 2;

    insert into public.workout_template_items (
      workout_template_section_id, exercise_id, instructions, prescribed_duration_seconds,
      prescribed_unit, sort_order, required, result_entry_type
    )
    values (
      section_speed_id,
      (select id from public.exercise_library where owner_user_id = target_owner_user_id and lower(name) = lower('Dynamic warm-up')),
      'Own each drill and stay deliberate.',
      540,
      'seconds',
      1,
      true,
      'checkbox'
    );

    insert into public.workout_template_items (
      workout_template_section_id, exercise_id, instructions, prescribed_sets, prescribed_reps,
      prescribed_distance, prescribed_unit, rest_seconds, sort_order, required, result_entry_type, target_value, target_unit
    )
    values
      (
        section_hitting_id,
        (select id from public.exercise_library where owner_user_id = target_owner_user_id and lower(name) = lower('Sprint work')),
        'Full recovery between reps. Log best split if you time it.',
        '6',
        '1',
        '15 yd',
        'yards',
        75,
        1,
        true,
        'duration',
        null,
        null
      ),
      (
        section_hitting_id,
        (select id from public.exercise_library where owner_user_id = target_owner_user_id and lower(name) = lower('Tee exit-velocity swings')),
        'Take your top 5 intent swings and record peak EV.',
        '5',
        '2 swings',
        null,
        null,
        45,
        2,
        true,
        'velocity',
        '88',
        'mph'
      );
  end if;
end;
$$;

alter table public.exercise_library enable row level security;
alter table public.workout_templates enable row level security;
alter table public.workout_template_sections enable row level security;
alter table public.workout_template_items enable row level security;
alter table public.assigned_workouts enable row level security;
alter table public.assigned_workout_sections enable row level security;
alter table public.assigned_workout_items enable row level security;
alter table public.workout_item_results enable row level security;

drop policy if exists "authorized users can view training weeks" on public.training_weeks;
drop policy if exists "admins can manage training weeks" on public.training_weeks;
drop policy if exists "authorized users can view readiness logs" on public.athlete_readiness_logs;
drop policy if exists "admins can manage readiness logs" on public.athlete_readiness_logs;

create policy "admins can view managed training weeks"
on public.training_weeks
for select
using (public.can_manage_athlete(athlete_id));

create policy "admins can manage training weeks phase 2"
on public.training_weeks
for all
using (public.can_manage_athlete(athlete_id))
with check (
  public.current_user_role() = 'admin'
  and public.can_manage_athlete(athlete_id)
);

create policy "admins manage exercise library"
on public.exercise_library
for all
using (public.is_admin_owner(owner_user_id))
with check (public.is_admin_owner(owner_user_id));

create policy "admins manage workout templates"
on public.workout_templates
for all
using (public.is_admin_owner(owner_user_id))
with check (public.is_admin_owner(owner_user_id));

create policy "admins manage workout template sections"
on public.workout_template_sections
for all
using (
  exists (
    select 1
    from public.workout_templates wt
    where wt.id = workout_template_id
      and public.is_admin_owner(wt.owner_user_id)
  )
)
with check (
  exists (
    select 1
    from public.workout_templates wt
    where wt.id = workout_template_id
      and public.is_admin_owner(wt.owner_user_id)
  )
);

create policy "admins manage workout template items"
on public.workout_template_items
for all
using (
  exists (
    select 1
    from public.workout_template_sections wts
    join public.workout_templates wt on wt.id = wts.workout_template_id
    where wts.id = workout_template_section_id
      and public.is_admin_owner(wt.owner_user_id)
  )
)
with check (
  exists (
    select 1
    from public.workout_template_sections wts
    join public.workout_templates wt on wt.id = wts.workout_template_id
    where wts.id = workout_template_section_id
      and public.is_admin_owner(wt.owner_user_id)
  )
);

create policy "view assigned workouts by access"
on public.assigned_workouts
for select
using (public.can_view_workout_for_athlete(athlete_id, status));

create policy "admins create assigned workouts"
on public.assigned_workouts
for insert
with check (
  public.current_user_role() = 'admin'
  and public.can_manage_athlete(athlete_id)
  and created_by = auth.uid()
);

create policy "admins and athletes update assigned workouts"
on public.assigned_workouts
for update
using (
  public.can_manage_athlete(athlete_id)
  or (
    public.can_edit_workout_progress_for_athlete(athlete_id)
    and status <> 'draft'
  )
)
with check (
  public.can_manage_athlete(athlete_id)
  or (
    public.can_edit_workout_progress_for_athlete(athlete_id)
    and status in ('in_progress', 'completed')
  )
);

create policy "admins delete draft assigned workouts"
on public.assigned_workouts
for delete
using (
  public.current_user_role() = 'admin'
  and public.can_manage_athlete(athlete_id)
  and status = 'draft'
);

create policy "view assigned workout sections by workout access"
on public.assigned_workout_sections
for select
using (
  exists (
    select 1
    from public.assigned_workouts aw
    where aw.id = assigned_workout_id
      and public.can_view_workout_for_athlete(aw.athlete_id, aw.status)
  )
);

create policy "admins manage assigned workout sections"
on public.assigned_workout_sections
for all
using (
  exists (
    select 1
    from public.assigned_workouts aw
    where aw.id = assigned_workout_id
      and public.can_manage_athlete(aw.athlete_id)
  )
)
with check (
  exists (
    select 1
    from public.assigned_workouts aw
    where aw.id = assigned_workout_id
      and public.can_manage_athlete(aw.athlete_id)
  )
);

create policy "view assigned workout items by workout access"
on public.assigned_workout_items
for select
using (
  exists (
    select 1
    from public.assigned_workout_sections aws
    join public.assigned_workouts aw on aw.id = aws.assigned_workout_id
    where aws.id = assigned_workout_section_id
      and public.can_view_workout_for_athlete(aw.athlete_id, aw.status)
  )
);

create policy "admins manage assigned workout items"
on public.assigned_workout_items
for all
using (
  exists (
    select 1
    from public.assigned_workout_sections aws
    join public.assigned_workouts aw on aw.id = aws.assigned_workout_id
    where aws.id = assigned_workout_section_id
      and public.can_manage_athlete(aw.athlete_id)
  )
)
with check (
  exists (
    select 1
    from public.assigned_workout_sections aws
    join public.assigned_workouts aw on aw.id = aws.assigned_workout_id
    where aws.id = assigned_workout_section_id
      and public.can_manage_athlete(aw.athlete_id)
  )
);

create policy "view workout item results by workout access"
on public.workout_item_results
for select
using (
  public.can_manage_athlete(athlete_id)
  or (
    exists (
      select 1
      from public.assigned_workout_items awi
      join public.assigned_workout_sections aws on aws.id = awi.assigned_workout_section_id
      join public.assigned_workouts aw on aw.id = aws.assigned_workout_id
      where awi.id = assigned_workout_item_id
        and aw.athlete_id = workout_item_results.athlete_id
        and public.can_view_workout_for_athlete(aw.athlete_id, aw.status)
    )
  )
);

create policy "admins and athletes insert workout item results"
on public.workout_item_results
for insert
with check (
  (
    public.current_user_role() = 'admin'
    and public.can_manage_athlete(athlete_id)
  )
  or (
    public.current_user_role() = 'athlete'
    and public.is_self_athlete(athlete_id)
    and public.assigned_workout_item_belongs_to_athlete(assigned_workout_item_id, athlete_id)
    and exists (
      select 1
      from public.assigned_workout_items awi
      join public.assigned_workout_sections aws on aws.id = awi.assigned_workout_section_id
      join public.assigned_workouts aw on aw.id = aws.assigned_workout_id
      where awi.id = assigned_workout_item_id
        and aw.status <> 'draft'
    )
  )
);

create policy "admins and athletes update workout item results"
on public.workout_item_results
for update
using (
  (
    public.current_user_role() = 'admin'
    and public.can_manage_athlete(athlete_id)
  )
  or (
    public.current_user_role() = 'athlete'
    and public.is_self_athlete(athlete_id)
    and public.assigned_workout_item_belongs_to_athlete(assigned_workout_item_id, athlete_id)
  )
)
with check (
  (
    public.current_user_role() = 'admin'
    and public.can_manage_athlete(athlete_id)
  )
  or (
    public.current_user_role() = 'athlete'
    and public.is_self_athlete(athlete_id)
    and public.assigned_workout_item_belongs_to_athlete(assigned_workout_item_id, athlete_id)
  )
);

create policy "admins manage readiness logs"
on public.athlete_readiness_logs
for all
using (
  public.current_user_role() = 'admin'
  and public.can_manage_athlete(athlete_id)
)
with check (
  public.current_user_role() = 'admin'
  and public.can_manage_athlete(athlete_id)
);

create policy "athletes and parents view readiness logs"
on public.athlete_readiness_logs
for select
using (
  public.can_manage_athlete(athlete_id)
  or (
    (public.is_self_athlete(athlete_id) or public.is_parent_linked(athlete_id))
    and (
      assigned_workout_id is null
      or exists (
        select 1
        from public.assigned_workouts aw
        where aw.id = assigned_workout_id
          and aw.status <> 'draft'
      )
    )
  )
);

create policy "athletes insert own readiness logs"
on public.athlete_readiness_logs
for insert
with check (
  public.current_user_role() = 'athlete'
  and public.is_self_athlete(athlete_id)
  and entered_by = auth.uid()
  and (
    assigned_workout_id is null
    or exists (
      select 1
      from public.assigned_workouts aw
      where aw.id = assigned_workout_id
        and aw.athlete_id = athlete_id
        and aw.status <> 'draft'
    )
  )
);

create policy "athletes update own readiness logs"
on public.athlete_readiness_logs
for update
using (
  public.current_user_role() = 'athlete'
  and public.is_self_athlete(athlete_id)
  and entered_by = auth.uid()
)
with check (
  public.current_user_role() = 'athlete'
  and public.is_self_athlete(athlete_id)
  and entered_by = auth.uid()
);

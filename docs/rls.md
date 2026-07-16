# RLS Strategy

## Helper functions

Phase 2 adds these helper functions in SQL:

- `is_admin_owner(target_owner_user_id)`
- `is_self_athlete(target_athlete_id)`
- `is_parent_linked(target_athlete_id)`
- `can_view_workout_for_athlete(target_athlete_id, target_status)`
- `can_edit_workout_progress_for_athlete(target_athlete_id)`
- `assigned_workout_item_belongs_to_athlete(target_item_id, target_athlete_id)`

All are `security definer` so RLS logic can resolve athlete relationships consistently from protected tables without duplicating joins in every policy. Their scope is intentionally narrow: they answer relationship questions, not broad data fetches.

## Table policy intent

### Admin-owned library tables

- `exercise_library`
- `workout_templates`
- `workout_template_sections`
- `workout_template_items`

Admins may manage only rows they own. Athletes and parents have no direct write path to these tables.

### Planning tables

- `training_weeks`
- `assigned_workouts`
- `assigned_workout_sections`
- `assigned_workout_items`

Admins can fully manage their own athletes’ plans and assigned workout snapshots.

Athletes and parents can view assigned workouts only when the workout is no longer in `draft`.

### Athlete-entered data

- `workout_item_results`
- `athlete_readiness_logs`

Athletes may insert and update only rows tied to their own athlete identity.

Parents are read-only.

Admins retain full visibility and management for their athletes.

## Additional guardrail

RLS alone cannot express per-column update restrictions. Because athletes are allowed to update progress-related fields on `assigned_workouts`, Phase 2 also adds the trigger function `guard_assigned_workout_athlete_updates()`.

That trigger rejects athlete attempts to change:

- title
- objective
- workout date
- source template
- training week
- admin notes
- skip reason
- created-by metadata

This is the main protection preventing athletes from modifying prescription content while still allowing:

- `status`
- `athlete_notes`
- `started_at`
- `completed_at`

## Published-workout visibility rule

The central visibility rule is:

- admins can always see workouts for athletes they manage
- athletes can see only their own workouts when status is not `draft`
- parents can see only linked-athlete workouts when status is not `draft`

That same rule is reused for:

- assigned workout rows
- assigned workout sections
- assigned workout items
- workout result rows
- readiness rows linked to assigned workouts

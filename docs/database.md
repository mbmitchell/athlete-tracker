# Database Overview

## Core identity and access

- `user_profiles`
  - app-facing role metadata for each Supabase auth user
- `athletes`
  - athlete profile, owning admin, and athlete login-link state
- `parent_athletes`
  - parent-to-athlete relationship table

## Athlete login-link fields

Phase 2.1 keeps account-linking intentionally small by extending `athletes` instead of adding a separate invitation table.

New `athletes` columns:

- `athlete_login_status`
  - `none`, `invited`, `connected`, `disabled`
- `login_email`
  - current invited or connected athlete email
- `invited_at`
- `connected_at`
- `disabled_at`

Existing `user_id` remains the linked auth user reference, but athlete access now depends on both:

- `user_id`
- `athlete_login_status`

That means:

- a disconnected athlete clears the auth link
- a disabled athlete keeps historical linkage metadata
- training history remains untouched by account actions

## Reusable library layer

- `exercise_library`
- `workout_templates`
- `workout_template_sections`
- `workout_template_items`

## Planning and assignment layer

- `training_weeks`
- `assigned_workouts`
- `assigned_workout_sections`
- `assigned_workout_items`

## Athlete completion layer

- `workout_item_results`
- `athlete_readiness_logs`

## Relationship summary

```text
user_profiles
  -> athletes.managed_by
  -> exercise_library.owner_user_id
  -> workout_templates.owner_user_id

athletes
  -> auth.users through athletes.user_id
  -> training_weeks.athlete_id
  -> assigned_workouts.athlete_id
  -> workout_item_results.athlete_id
  -> athlete_readiness_logs.athlete_id

workout_templates
  -> workout_template_sections.workout_template_id
  -> assigned_workouts.source_template_id

workout_template_sections
  -> workout_template_items.workout_template_section_id

training_weeks
  -> assigned_workouts.training_week_id

assigned_workouts
  -> assigned_workout_sections.assigned_workout_id
  -> athlete_readiness_logs.assigned_workout_id

assigned_workout_sections
  -> assigned_workout_items.assigned_workout_section_id

assigned_workout_items
  -> workout_item_results.assigned_workout_item_id
```

## Integrity constraints added for onboarding

- one auth user cannot be actively linked to multiple athletes
- one athlete cannot keep multiple active logins in this phase
- admin and parent accounts are blocked from being connected as athlete logins
- disabling or disconnecting a login does not delete athlete data

## Snapshot principle

Templates and exercise-library records are reused only at assignment time. Once a workout is assigned, sections and items are copied into the `assigned_*` tables so later library edits do not rewrite historical athlete prescriptions.

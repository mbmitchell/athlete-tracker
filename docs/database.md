# Database Overview

## Core identity and access

- `user_profiles`
  - application role metadata for each auth user
- `athletes`
  - athlete profile plus owning admin/trainer
- `parent_athletes`
  - parent-to-athlete link table

## Reusable library layer

- `exercise_library`
  - reusable exercise definitions owned by one admin
- `workout_templates`
  - reusable workout definitions owned by one admin
- `workout_template_sections`
  - ordered template sections
- `workout_template_items`
  - ordered template prescription rows

## Planning and assignment layer

- `training_weeks`
  - one athlete/week planning container
- `assigned_workouts`
  - athlete/date workout snapshot
- `assigned_workout_sections`
  - ordered section snapshot for that assigned workout
- `assigned_workout_items`
  - ordered prescription snapshot for that assigned workout

## Athlete completion layer

- `workout_item_results`
  - athlete-entered result rows keyed to assigned workout items
- `athlete_readiness_logs`
  - daily readiness entry, optionally linked to a specific assigned workout

## Relationship summary

```text
user_profiles
  -> athletes.managed_by
  -> exercise_library.owner_user_id
  -> workout_templates.owner_user_id

athletes
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

## Snapshot principle

Templates and exercise-library records are reused only at assignment time. Once a workout is assigned, its sections and items are copied into the `assigned_*` tables. This prevents later template or exercise edits from changing historical athlete prescriptions.

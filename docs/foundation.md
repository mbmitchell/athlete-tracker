# Athlete Development Hub Foundation

## Current Audit

### What Phase 1 already gave us

- `user_profiles`, `athletes`, and `parent_athletes` already modeled the core viewer roles and athlete relationship boundaries.
- The App Router shell, Supabase session helpers, and protected proxy flow were already in place.
- The mobile-first visual system, navigation shell, and athlete profile pages were already established.

### What was reusable as-is

- auth/session resolution in `lib/auth/session.ts`
- athlete ownership helpers in the initial migration: `current_user_role`, `can_manage_athlete`, `can_access_athlete`
- athlete CRUD flow and protected layouts
- the PWA/Vercel-ready Next.js setup

### What needed to change for Phase 2

- `training_weeks` needed richer planning fields: `title`, `status`, and `admin_notes`
- the original `training_days` and `workout_*` tables were too narrow for template snapshots and flexible result-entry types
- readiness collection needed athlete-entered sleep/energy/soreness/stress fields and a link to a specific assigned workout
- demo mode needed baseball-specific athletes, plans, templates, and workout states

## Migration Changes

Phase 2 adds a second migration: [supabase/migrations/202607152130_phase2_workout_planning.sql](/Users/mmitchell/dev/athlete-tracker/supabase/migrations/202607152130_phase2_workout_planning.sql)

### Added enums

- `exercise_category`
- `workout_result_type`
- `training_week_status`
- `assigned_workout_status`

### Refined existing tables

- `training_weeks`
  - adds `title`
  - adds `status`
  - renames `notes` to `admin_notes`

- `athlete_readiness_logs`
  - links readiness entries to `assigned_workouts`
  - adds `sleep_hours`, `sleep_quality`, `energy`, `soreness`, `stress`, `entered_by`
  - keeps historical chartability independent of workout result rows

### New Phase 2 tables

- `exercise_library`
- `workout_templates`
- `workout_template_sections`
- `workout_template_items`
- `assigned_workouts`
- `assigned_workout_sections`
- `assigned_workout_items`
- `workout_item_results`

### Snapshot strategy

- templates remain reusable blueprints
- assigned workouts copy section and item data into athlete-specific snapshot tables
- later edits to templates or exercises do not rewrite historical athlete assignments

## Route And Component Architecture

### New routes

- `/athletes/[athleteId]/weeks/[weekStart]`
  - weekly planning surface for admins
- `/athletes/[athleteId]/workouts/[workoutId]/edit`
  - workout builder for a specific assigned workout
- `/library/exercises`
  - exercise library management
- `/library/templates`
  - template library management and assignment

### Updated routes

- `/calendar`
  - now reflects assigned workouts rather than placeholder weekly cards
- `/workouts/[date]`
  - now loads the real daily workout model and athlete result workflow

### Key Phase 2 components

- `components/planning/week-planner.tsx`
- `components/planning/workout-builder.tsx`
- `components/library/exercise-library.tsx`
- `components/library/template-library.tsx`
- `components/workouts/workout-progress-form.tsx`
- `components/workouts/daily-workout-view.tsx`

## Security And Data Integrity Concerns

### Primary concerns addressed

- athletes must never update prescriptions or admin notes
- parents must remain read-only
- assigned workouts must be immutable snapshots from the admin point of view once copied
- completed results must not be silently edited
- readiness rows must belong only to the athlete entering them

### Controls used

- row-level security on every new Phase 2 table
- helper functions for owner/admin, self-athlete, parent link, and published-workout visibility
- trigger guard on `assigned_workouts` to prevent athlete-side prescription/admin-field changes even when an athlete is allowed to update status/notes/progress metadata
- unique constraints on athlete workout dates and workout-result ownership

## Implementation Summary

### Admin workflow now supported

- manage reusable exercises
- manage reusable templates
- seed a baseball starter library
- create and edit a weekly athlete plan
- create blank workouts or assign templates by date
- open a workout builder
- add, edit, reorder, and delete sections and items
- copy workouts and copy prior weeks
- publish and safely unpublish weeks

### Athlete workflow now supported

- open published workouts by date
- save partial progress
- enter readiness data
- enter result values by result-entry type
- complete a session
- reopen completed work only through explicit edit mode

## Testing Coverage Added

See [tests/workouts.test.ts](/Users/mmitchell/dev/athlete-tracker/tests/workouts.test.ts).

Covered logic:

- role-based access
- athlete isolation
- readiness ownership
- snapshot independence
- template-to-assigned-workout immutability
- workout status transitions
- required versus optional completion behavior
- week unpublish safety

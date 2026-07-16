# RLS Strategy

## Core rule

Athlete data is visible only when a relationship is both present and active.

For athlete users, that now means:

- `athletes.user_id = auth.uid()`
- `athlete_login_status in ('invited', 'connected')`
- `disabled_at is null`

So disabling or disconnecting a login removes athlete access immediately without deleting workouts, readiness, or results.

## Helper functions

Key SQL helpers now include:

- `current_user_role()`
- `can_manage_athlete(target_athlete_id)`
- `is_active_athlete_login(target_athlete_id)`
- `can_access_athlete(target_athlete_id)`
- `is_self_athlete(target_athlete_id)`
- `is_parent_linked(target_athlete_id)`
- `can_view_workout_for_athlete(target_athlete_id, target_status)`
- `can_edit_workout_progress_for_athlete(target_athlete_id)`

They stay narrow on purpose: each answers a relationship question so policies do not duplicate protected joins.

## Table policy intent

### Athlete profile table

- admins can manage only athletes they own
- athletes can view themselves only when their login link is active
- parents can view only explicitly linked athletes

### Planning and workout tables

- admins can fully manage workouts for their own athletes
- athletes can view only non-draft workouts tied to their own active athlete link
- parents can view only non-draft workouts tied to linked athletes

### Athlete-entered data

- athletes can write only their own readiness and result rows
- parents remain read-only
- admins retain full management for owned athletes

## Account-linking safeguards

The service-role client is used only for:

- sending athlete invitations
- connecting an existing auth user to an athlete
- resending invitations
- disabling athlete logins
- finalizing invite-to-connected status after first sign-in

Normal athlete/workout/readiness/results access does not use the service role and continues to rely on authenticated user context plus RLS.

## Additional guardrails

- athlete login actions are server-only
- the app verifies the requesting user is an admin before any service-role mutation runs
- client components must not import the service-role client
- demo mode is only allowed when public Supabase config is entirely absent
- configured environments throw visible setup/runtime errors instead of silently using preview data

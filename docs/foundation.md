# Athlete Development Hub Foundation

## What Phase 2.1 Adds

Phase 2.1 stays intentionally small and product-focused. It does not add messaging, recruiting workflows, analytics, AI, or payments.

It adds:

- production-oriented athlete onboarding
- server-side Supabase invitation and login-link management
- a first-admin setup page with safe operational checks
- explicit demo-mode separation from configured environments
- a stronger athlete first-login and blocked-access experience

## Reused Foundation

The following Phase 1 and Phase 2 pieces stayed in place:

- App Router protected shell
- Supabase session helpers
- role-aware navigation
- athlete CRUD flow
- weekly planning and daily workout models
- template and exercise library model
- PWA and Vercel-ready structure

## New Architecture Added

### Server-only admin auth client

- [lib/supabase/admin.ts](/Users/mmitchell/dev/athlete-tracker/lib/supabase/admin.ts)

This file is marked `server-only` and is used only for Supabase Auth admin actions.

### Account-link orchestration

- [lib/athletes/account-management.ts](/Users/mmitchell/dev/athlete-tracker/lib/athletes/account-management.ts)
- [lib/athletes/account-links.server.ts](/Users/mmitchell/dev/athlete-tracker/lib/athletes/account-links.server.ts)

Responsibilities:

- invitation-state transitions
- existing-user link validation
- admin/parent account blocking
- duplicate-auth-user prevention
- post-invite first-login finalization

### New product surfaces

- `/admin/setup`
  - safe onboarding and environment checks
- athlete profile account-management card
  - invite
  - connect existing auth user
  - resend invite
  - disable login
  - disconnect login

## Demo And Production Separation

Runtime behavior now distinguishes:

- `missing` public Supabase config
  - allowed demo mode
- `partial` public Supabase config
  - setup error
- fully configured public Supabase config
  - real data only, no silent preview fallback

The shell also shows a persistent banner in demo mode so preview sessions are visually obvious.

## Athlete Access Model

An athlete login is now treated as one of four states:

- `none`
- `invited`
- `connected`
- `disabled`

This gives admins safer onboarding controls without editing `athletes.user_id` by hand.

## First-login And Blocked-access UX

After invite acceptance and sign-in:

- athletes route to their dashboard
- today’s training status is shown using real assigned-workout data
- no admin navigation is exposed

If an athlete login is disabled or disconnected while a session exists:

- protected athlete data stops loading
- the app shows a clear blocked or unlinked notice
- sign-out remains easy on mobile

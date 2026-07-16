# Athlete Development Hub

Athlete Development Hub is a mobile-first multi-athlete training application built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui-compatible components, and Supabase.

The current foundation in this repo includes:

- a secure role model for `admin`, `athlete`, and `parent`
- Supabase schema and row-level security migrations
- Supabase email/password authentication flow
- protected App Router layouts and role-aware mobile navigation
- weekly planning, workout assignment, and athlete completion tracking workflows
- exercise and template libraries
- Progressive Web App metadata for Vercel deployment

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-compatible component structure
- Supabase Auth and PostgreSQL
- Vercel-ready deployment structure
- PWA manifest and installable metadata

## Project Structure

See:

- [docs/foundation.md](/Users/mmitchell/dev/athlete-tracker/docs/foundation.md)
- [docs/database.md](/Users/mmitchell/dev/athlete-tracker/docs/database.md)
- [docs/rls.md](/Users/mmitchell/dev/athlete-tracker/docs/rls.md)

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env.local
```

3. Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

4. Create a Supabase project and apply the migrations:

```bash
supabase db push
```

If you are not using the local Supabase CLI workflow, run both SQL files in order:

- [supabase/migrations/202607151930_initial_schema.sql](/Users/mmitchell/dev/athlete-tracker/supabase/migrations/202607151930_initial_schema.sql)
- [supabase/migrations/202607152130_phase2_workout_planning.sql](/Users/mmitchell/dev/athlete-tracker/supabase/migrations/202607152130_phase2_workout_planning.sql)

5. Install and run locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Authentication Notes

- New auth users automatically get a `user_profiles` row through the migration trigger.
- The default trigger role is `athlete` unless `raw_user_meta_data.role` is explicitly set to `admin`, `athlete`, or `parent`.
- Admins should create athlete and parent relationships after the auth account exists.

## Starter Library Seed

After your admin user exists, seed the baseball starter library in either of these ways:

1. Open `/library/exercises` and click `Seed starter library`.
2. Or call the SQL function:

```sql
select public.seed_baseball_starter_data('<admin-user-profile-id>');
```

## Deployment

The app is prepared for Vercel:

- standard Next.js App Router structure
- no custom server requirement
- environment-driven Supabase configuration
- PWA metadata via App Router manifest and icon routes

Recommended Vercel environment variables:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Current Scope

Included:

- login flow
- role-aware protected shell
- admin dashboard
- athlete directory
- create and edit athlete profile forms
- athlete week planner
- workout builder
- exercise library
- template library
- athlete dashboard
- weekly calendar
- daily workout view with readiness and result entry

Explicitly excluded:

- payment processing
- public athlete profiles
- messaging
- social media integrations

## Validation Commands

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

## Notes

- When Supabase environment variables are not configured, the app falls back to a demo preview mode so the UI can still be reviewed locally.
- Demo preview now includes Colt and Lane plus sample published, in-progress, and completed baseball workouts.
- Templates are reusable, but assigned workouts are stored as snapshots so historical prescriptions do not drift when a library record changes later.

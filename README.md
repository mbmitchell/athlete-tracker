# Athlete Development Hub

Athlete Development Hub is a mobile-first training application built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui-style primitives, and Supabase Auth/PostgreSQL.

The current foundation includes:

- secure role separation for `admin`, `athlete`, and `parent`
- athlete profile management
- weekly planning, workout assignment, and daily execution flows
- Supabase-backed athlete account invitations and login linking
- Vercel-ready environment setup
- PWA metadata and installable manifest support
- explicit demo mode with a persistent non-persistent warning

## Project Structure

- [docs/foundation.md](/Users/mmitchell/dev/athlete-tracker/docs/foundation.md)
- [docs/database.md](/Users/mmitchell/dev/athlete-tracker/docs/database.md)
- [docs/rls.md](/Users/mmitchell/dev/athlete-tracker/docs/rls.md)

## Required Environment Variables

Copy the template:

```bash
cp .env.example .env.local
```

Fill in:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Notes:

- `SUPABASE_SERVICE_ROLE_KEY` is required for athlete invitations, connecting existing auth users, resending invites, and disabling athlete logins.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser code or as a `NEXT_PUBLIC_` variable.
- Normal athlete, workout, readiness, and results access still uses the authenticated anon-key client with RLS.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project:
   - Open the Supabase dashboard.
   - Create a new project.
   - Wait for the database and Auth services to finish provisioning.

3. Find the project URL and anon key:
   - In Supabase, open `Project Settings -> API`.
   - Copy `Project URL` into `NEXT_PUBLIC_SUPABASE_URL`.
   - Copy `anon public` into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

4. Find and safely store the service-role key:
   - In the same `Project Settings -> API` screen, copy `service_role`.
   - Put it only in `.env.local` and Vercel server-side environment variables.
   - Do not print it in logs or return it from routes/actions.

5. Apply migrations:

```bash
supabase db push
```

If you are applying SQL manually, run these files in order:

- [supabase/migrations/202607151930_initial_schema.sql](/Users/mmitchell/dev/athlete-tracker/supabase/migrations/202607151930_initial_schema.sql)
- [supabase/migrations/202607152130_phase2_workout_planning.sql](/Users/mmitchell/dev/athlete-tracker/supabase/migrations/202607152130_phase2_workout_planning.sql)
- [supabase/migrations/202607152245_phase21_athlete_account_linking.sql](/Users/mmitchell/dev/athlete-tracker/supabase/migrations/202607152245_phase21_athlete_account_linking.sql)

6. Run the app:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000).

## Creating The First Admin User

This app currently ships with sign-in, not self-serve sign-up, so the first admin is easiest to create from Supabase.

1. In Supabase, open `Authentication -> Users`.
2. Create a user with the email you want for the admin/trainer.
3. Set a password for that user.
4. Confirm the user if your project requires email confirmation before sign-in.
5. Run this SQL in the Supabase SQL editor:

```sql
update public.user_profiles
set role = 'admin'
where email = 'coach@example.com';
```

6. Sign in to the app with that email and password.
7. Open `/admin/setup` and confirm:
   - Supabase shows as configured
   - your current role is `admin`
   - service role status is configured

## Admin Setup Page

The admin onboarding checks live at `/admin/setup`.

It shows:

- Supabase connection status
- service-role availability
- a safe operational migration check
- current signed-in user role
- number of athletes
- number of linked athlete accounts
- number of published workouts

The migration check intentionally reports an operational state rather than pretending to prove every migration with certainty.

## Athlete Invitation And Linking Flow

The app uses a server-only Supabase admin client in [lib/supabase/admin.ts](/Users/mmitchell/dev/athlete-tracker/lib/supabase/admin.ts).

Current invitation flow:

1. An admin opens an athlete profile edit page.
2. In `Athlete account management`, the admin enters the athlete email.
3. `Invite athlete by email` calls Supabase Auth admin invitation server-side using the service-role key.
4. The invited auth user is linked to the athlete record and marked `Invitation pending`.
5. After the athlete completes the invite flow and signs in, the app finalizes the link and moves the athlete to `Login connected`.

Connecting an existing auth user:

1. Open the same athlete profile.
2. Enter an email that already exists in Supabase Auth.
3. Click `Connect existing user`.
4. The app blocks admin accounts and parent accounts from being repurposed as athlete logins.
5. The app also blocks connecting one auth user to multiple athlete profiles.

Disable and disconnect behavior:

- `Disable login` keeps the athlete profile, workouts, readiness, and results intact while immediately blocking athlete access.
- `Disconnect login` clears the auth linkage from the athlete profile without deleting training history.

## Inviting Colt And Lane

1. Sign in as your admin/trainer.
2. Create athlete profiles for Colt and Lane from `/athletes/new` if they do not already exist.
3. Open Colt’s edit page.
4. In `Athlete account management`, enter Colt’s email and click `Send invitation`.
5. Repeat for Lane.
6. Ask each athlete to open their Supabase invite email and finish password setup.
7. After each athlete signs in the first time, refresh the athlete edit page and confirm the status changed from `Invitation pending` to `Login connected`.

If Colt or Lane already has a Supabase Auth user:

1. Open the athlete edit page.
2. Enter the existing auth email in `Connect existing authentication user`.
3. Click `Connect existing user`.
4. Confirm the status reads `Login connected`.

## Verifying Athlete Isolation

Use at least two athlete accounts.

1. Sign in as Colt.
2. Confirm Colt sees only:
   - Colt’s dashboard
   - Colt’s calendar
   - Colt’s workouts
3. Sign out and sign in as Lane.
4. Confirm Lane does not see Colt’s name, workouts, readiness entries, or results.
5. While signed in as an athlete, try opening another athlete’s workout URL by changing the `athleteId` query parameter.
6. Confirm the app does not reveal the unrelated athlete’s data.
7. As an admin, disable one athlete login and verify that athlete can no longer access protected athlete pages.

## Demo Mode And Production Behavior

When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are both missing, the app enters demo mode.

Demo mode behavior:

- shows a persistent `Demo mode - changes are not saved.` banner
- returns seeded preview athletes and planning UI
- never claims changes were persisted

Configured-production behavior:

- the app does not silently fall back to demo mode
- incomplete env configuration raises a clear setup error
- runtime Supabase failures surface an application error instead of fake demo data

## Vercel Deployment

1. Push the repo to your Git provider.
2. Create a new Vercel project pointing to this repo.
3. In Vercel project settings, add:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Set `NEXT_PUBLIC_APP_URL` to your production app URL.
5. Redeploy after saving environment variables.
6. Apply the same SQL migrations to the production Supabase project.
7. Create or promote your first admin user in the production Supabase project.
8. Sign in and verify `/admin/setup` before inviting athletes.

## Starter Library Seed

After your admin account is working, seed the starter baseball library from `/library/exercises` with `Seed starter library`, or run:

```sql
select public.seed_baseball_starter_data('<admin-user-profile-id>');
```

## Validation

Run:

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

## Known Limitations

- The app currently supports one athlete login per athlete profile in this phase.
- Parent account linking is still read-only and does not yet have a dedicated parent dashboard.
- Re-enabling a disabled athlete account is not yet a separate admin action; the current safe path is to reconnect or re-invite deliberately.
- The setup page uses safe operational checks rather than a guaranteed migration fingerprint.

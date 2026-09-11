# Supabase Setup (optional cloud sync)

Cloud accounts and cross-device sync are **entirely optional**. With no Supabase project
configured, the app runs exactly as before — full guest mode, LocalStorage-only, offline-first.
Nothing in this document is required to use the app.

**As of writing this, no Supabase project has been created for this app, and no environment
variables are set anywhere in this repository or its deployment.** `isSupabaseConfigured` (in
`src/lib/supabase/client.ts`) is `false` until you complete the steps below — do not assume
otherwise.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account/project.
2. Once the project is provisioned, go to **Project Settings → API**.
3. Copy the **Project URL** and the **`anon` `public`** key (not the `service_role` key — that one
   must never be used client-side).

## 2. Run the database schema

1. In the Supabase Dashboard, open **SQL Editor → New query**.
2. Paste the entire contents of [`supabase/schema.sql`](../supabase/schema.sql) from this repo and
   run it.
3. This creates five tables (`profiles`, `exercise_progress`, `practice_sessions`,
   `video_progress`, `user_achievements`), enables Row Level Security on all of them, and adds
   `auth.uid() = user_id` policies so a signed-in user can only ever touch their own rows.
4. The script is idempotent — safe to re-run if you change it later.

## 3. Set environment variables

Copy `.env.example` to `.env` and fill in the two values from step 1:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Restart `npm run dev` (or redeploy) after changing this file — Vite only reads env vars at
startup/build time.

**On Vercel** (or any host): add both as project environment variables in the dashboard, not by
committing `.env` — `.env` is gitignored for exactly this reason.

## 4. Regenerate types (recommended once the project exists)

`src/lib/supabase/database.types.ts` was hand-written to match `supabase/schema.sql` exactly, since
no live project existed while building this. Once your project exists, regenerate it for a
guaranteed match:

```bash
npx supabase gen types typescript --project-id <your-project-ref> > src/lib/supabase/database.types.ts
```

## What you get once this is done

- Settings → Account (or the "Keep your progress safe" prompt on Home, shown after some real
  progress — never forced at onboarding) lets a user sign up / sign in with email+password.
- The first sign-in triggers `syncNow()` (`src/services/syncService.ts`), which pulls any existing
  cloud data, merges it with whatever was practiced as a guest using the documented rules (see that
  file's header comment), writes the merged result back to LocalStorage, and pushes it back to
  Supabase — this **is** the guest-to-account migration, not a separate code path.
- Every subsequent sign-in on any device re-runs the same merge, which is how cross-device sync
  works: two devices converge to the same merged state the next time either one calls `syncNow()`.

## What this does NOT do

- No background/automatic sync interval is implemented — sync happens on sign-in and can be
  triggered again by re-opening Settings → Account. A periodic background sync would be a
  reasonable follow-up but was out of scope here.
- No realtime (Supabase Realtime / websocket) sync between simultaneously-open devices — this is a
  pull-merge-push model, not live collaboration.

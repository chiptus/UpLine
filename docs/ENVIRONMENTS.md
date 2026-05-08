# Environments

UpLine runs against three Supabase environments.

| Env | Project | Used by | Auto-pause? |
| --- | --- | --- | --- |
| **prod** | `qssmazlqrmxiudxckxvi` | `pnpm run dev`, `pnpm run build` | no |
| **staging** | a second free Supabase project | `pnpm run dev:staging`, `pnpm run build:staging` | yes (after 7 days idle) |
| **local** | Supabase CLI (`supabase start`) | `pnpm run dev:local`, e2e tests | n/a |

The frontend reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` from a Vite env file picked by `--mode`. Vite loads them in this order (later overrides earlier):

```
.env  ->  .env.[mode]  ->  .env.local  ->  .env.[mode].local
```

`.env.local` and `.env.[mode].local` are gitignored. `.env.example`, `.env.staging.example`, and `.env.local.example` are committed as templates.

## One-time setup

### 1. Create the staging Supabase project

In the Supabase dashboard, create a second project (free tier is fine). Name it something like `upline-staging`.

After it's created:

- Apply the same migrations as prod:
  ```bash
  supabase link --project-ref <staging-ref>
  supabase db push
  ```
- Copy the project URL and anon key from **Project Settings -> API**.

### 2. Wire up env files

```bash
cp .env.example          .env.local            # prod creds
cp .env.staging.example  .env.staging.local    # staging creds
cp .env.local.example    .env.local.local      # local Supabase (optional)
```

Fill in the URLs and anon keys. Anon keys are safe in the browser bundle, but the convention here keeps them out of git so each developer can swap targets.

### 3. Wire up the sync script

```bash
cp scripts/.env.sync.example scripts/.env.sync
```

Open `scripts/.env.sync` and paste the **direct Postgres connection strings** (Project Settings -> Database -> Connection string -> URI) for prod and staging. This file is gitignored.

You'll need `pg_dump` and `psql` on your machine — both ship with the Postgres client tools (`brew install libpq` on macOS, `apt-get install postgresql-client` on Debian/Ubuntu).

## Day-to-day

### Run the app against an env

```bash
pnpm run dev            # prod (default — be careful, this is real data)
pnpm run dev:staging    # staging
pnpm run dev:local      # local supabase
```

### Sync prod data into staging or local

```bash
pnpm run db:sync:staging   # overwrites staging public schema with prod data
pnpm run db:sync:local     # overwrites local public schema with prod data
```

Both prompt for confirmation before touching the target. The script:

1. **Syncs `auth.users`** from prod into a temp table on the target, then upserts with `ON CONFLICT (id) DO NOTHING`. New rows have:
   - `email` rewritten to `user-<short-id>@example.test`
   - no `encrypted_password` (synced users can't sign in)
   - `raw_user_meta_data` / `raw_app_meta_data` stripped of OAuth/profile info
   - `is_super_admin = false`

   Your existing test accounts on the target are **preserved** because of the `ON CONFLICT` clause. They keep their original emails and passwords, so you can still log in as them.
2. `pg_dump`s the `public` schema (data only) from prod.
3. `TRUNCATE`s the target's `public` tables.
4. Restores the dump. FK references from `public.*` to `auth.users(id)` now resolve, so RLS policies that check `auth.uid()` work for any user — log in as a test account and you can read/write any synced row that user owns.
5. Runs `scripts/anonymize.sql` to scrub remaining PII (`profiles.username`, `artist_notes.note_content`, `group_invites.invite_token`).

To skip auth syncing (public schema only):

```bash
SYNC_AUTH=0 pnpm run db:sync:staging
```

### When PII shape changes

If you add a column that holds free-form user input or a personal identifier, **edit `scripts/anonymize.sql`** to scrub it. The dump-and-anonymize approach is only safe as long as that file is kept current.

### Promoting a migration to staging, then prod

1. Develop locally (`supabase migration new …`, edit, `supabase db reset`).
2. Push to staging: `supabase link --project-ref <staging-ref> && supabase db push`.
3. Verify in the staging app (`pnpm run dev:staging`).
4. Push to prod: `supabase link --project-ref qssmazlqrmxiudxckxvi && supabase db push`.

Re-link to whichever project you intend to operate on — the Supabase CLI keeps a single linked project at a time.

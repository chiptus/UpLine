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

Branching model: there is only `main`. Feature branches are PR'd directly to it. Vercel preview deploys (any non-`main` branch) point at the **staging** Supabase project, so you test the PR against staging before merging.

Day-to-day flow:

1. Develop locally on a feature branch (`supabase migration new …`, edit, `supabase db reset` to verify).
2. Open a PR against `main`. Two things happen automatically:
   - Vercel deploys a preview URL wired to staging Supabase.
   - If the PR touched `supabase/migrations/**`, the **DB Migrate** workflow pushes those migrations to staging. Subsequent commits to the PR re-run it (`supabase db push` is idempotent — already-applied migrations are skipped).
3. Test the preview URL against staging.
4. Merge to `main`. The same workflow runs against prod.

You can also trigger the workflow manually from the Actions tab (workflow_dispatch) — useful for re-running a push or migrating staging when no migration file changed.

Caveat about staging drift: an abandoned PR can leave a stray migration applied to staging that no longer exists in `main`. Postgres can't roll it back automatically. If staging gets confused, recovery is `supabase db reset --linked` (with staging linked) — destructive, but staging is meant to be disposable. Re-seed afterwards with `pnpm run db:sync:staging`.

### CI secrets required

The DB-migrate workflow reads these from GitHub Actions secrets (Settings -> Secrets and variables -> Actions):

| Secret | Where to find it |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | https://supabase.com/dashboard/account/tokens — generate a personal access token |
| `PROD_PROJECT_REF` | `qssmazlqrmxiudxckxvi` (already public, but kept as a secret for symmetry with staging) |
| `STAGING_PROJECT_REF` | the staging project's ref (visible in its dashboard URL) |
| `PROD_DB_PASSWORD` | Project Settings -> Database -> Database password |
| `STAGING_DB_PASSWORD` | Same, for the staging project |

The workflow also references `staging` and `production` GitHub **environments**. They don't need any settings to function, but you should add a required-reviewer protection rule to the `production` environment (Settings -> Environments -> production -> Required reviewers). Without it, every merge to `main` that touches a migration applies it to prod immediately.

### Manual fallback

If you need to push a migration without going through CI:

```bash
supabase link --project-ref <ref> && supabase db push
```

Re-link to whichever project you intend to operate on — the Supabase CLI keeps a single linked project at a time.

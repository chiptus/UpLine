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

1. `pg_dump`s the `public` schema (data only) from prod.
2. `TRUNCATE`s the target's `public` tables.
3. Restores the dump.
4. Runs `scripts/anonymize.sql` to scrub PII (`profiles.username`, `artist_notes.note_content`, `group_invites.invite_token`).

`auth.users` is **never** copied — keep test accounts on staging/local separate from real users. A consequence is that `user_id` columns in synced data point to UUIDs that don't exist in the target's `auth.users`. That's fine for read-only browsing of data, but writes that join against `auth.users` (e.g. RLS checks) will only work for rows owned by your test user.

### When PII shape changes

If you add a column that holds free-form user input or a personal identifier, **edit `scripts/anonymize.sql`** to scrub it. The dump-and-anonymize approach is only safe as long as that file is kept current.

### Promoting a migration to staging, then prod

1. Develop locally (`supabase migration new …`, edit, `supabase db reset`).
2. Push to staging: `supabase link --project-ref <staging-ref> && supabase db push`.
3. Verify in the staging app (`pnpm run dev:staging`).
4. Push to prod: `supabase link --project-ref qssmazlqrmxiudxckxvi && supabase db push`.

Re-link to whichever project you intend to operate on — the Supabase CLI keeps a single linked project at a time.

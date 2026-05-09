# Environments

| Env | Project | Used by |
| --- | --- | --- |
| **local** | Supabase CLI (`supabase start`) | `pnpm run dev` (default), e2e tests |
| **staging** | a second Supabase project | `pnpm run dev:staging`, Vercel preview deploys |
| **prod** | `qssmazlqrmxiudxckxvi` | `pnpm run dev:prod`, Vercel production |

The frontend reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` from a Vite env file picked by `--mode`. Vite load order (later overrides earlier):

```
.env  ->  .env.local  ->  .env.[mode]  ->  .env.[mode].local
```

`*.local` files are gitignored; the `*.example` files are templates.

## Setting up a new Supabase project (e.g. staging)

1. **Create the project** in the Supabase dashboard.
2. **Configure auth** (Authentication → Sign In / Providers → Email):
   - "Confirm email" → **off**
   - "Email OTP Length" → **6**
   - Site URL and additional redirect URLs → match prod
3. **Paste the magic-link email template** (Authentication → Email Templates → Magic Link) from `supabase/templates/magic_link.html`. Re-paste on every change.
4. **Apply migrations**: GitHub → Actions → **DB Migrate** → Run workflow → target = `staging`.
5. **Save the database password** (Project Settings → Database). You'll need it for GitHub secrets and `scripts/.env.sync`.

## GitHub Actions config

Settings → Secrets and variables → Actions.

**Variables:**

| Name | Value |
| --- | --- |
| `PROD_PROJECT_REF` | `qssmazlqrmxiudxckxvi` |
| `STAGING_PROJECT_REF` | the staging project's ref |

**Secrets:**

| Name | Source |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | https://supabase.com/dashboard/account/tokens |
| `PROD_DB_PASSWORD` | Project Settings → Database |
| `STAGING_DB_PASSWORD` | Same, on the staging project |

Add a **required-reviewer** rule to the `production` GitHub environment (Settings → Environments → production) so prod migrations pause for approval.

## Vercel config

Project Settings → Environment Variables. For each Supabase var, add it twice:

| Variable | Production scope (main) | Preview scope (everything else) |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | prod URL | staging URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | prod anon key | staging anon key |
| `VITE_PUBLIC_POSTHOG_KEY` | PostHog key | same |
| `VITE_PUBLIC_POSTHOG_HOST` | PostHog host | same |

## Local prerequisites

- **Supabase CLI** + **Docker** (for `supabase start`)
- **Postgres client tools** for the sync script: `brew install libpq` on macOS (and add `/opt/homebrew/opt/libpq/bin` to your PATH), `apt-get install postgresql-client` on Debian.
- Copy env templates:
  ```bash
  cp .env.local.example  .env.local              # local supabase
  cp .env.staging.example .env.staging.local     # staging
  cp scripts/.env.sync.example scripts/.env.sync # prod + staging direct DB connection strings (for sync script)
  ```

## Day-to-day commands

```bash
pnpm run dev                # local supabase (requires `supabase start`)
pnpm run dev:staging        # staging
pnpm run dev:prod           # prod (real data — be careful)
pnpm run db:sync:staging    # overwrite staging public schema with prod data, anonymized
pnpm run db:sync:local      # same, into local supabase
```

The sync script syncs `auth.users` (with anonymized emails, no passwords) and `public.*` (PII scrubbed via `scripts/anonymize.sql`). Existing target users on `auth.users` are preserved via `ON CONFLICT DO NOTHING`. Skip auth sync with `SYNC_AUTH=0`.

If you add a public-schema column that holds free-form user input or PII, update `scripts/anonymize.sql`.

## Migration flow

- PR → `main`: Vercel preview points at staging. If the PR touches `supabase/migrations/**`, **DB Migrate** auto-pushes to staging. `supabase db push` is idempotent so re-runs on each commit are safe.
- Merge to `main`: **DB Migrate** auto-pushes to prod (gated by the `production` environment's reviewer rule, if configured).
- Manual: Actions → **DB Migrate** → Run workflow → pick target.

## Auth email template

`supabase/templates/magic_link.html` is the source of truth. `supabase/config.toml` wires it into local supabase automatically. For staging and prod, paste it into the dashboard manually after each change (Authentication → Email Templates → Magic Link). Automating this via the Supabase Management API is a future improvement.

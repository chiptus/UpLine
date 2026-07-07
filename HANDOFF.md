# Handoff: finalize the `run-upline` skill against staging

> Temporary doc for the next agent. Delete before merging PR #96.

## Goal for the next session

Finish the `run-upline` skill so it launches the app **with real data** and
verifies a UI change end-to-end. The decision (after exploring options) is to
run the app locally against the **staging** Supabase, not a local Supabase
stack. See "Why staging" below.

**One-line kickoff:** "finalize the run-upline skill against staging."

## Prerequisites — must be live in your session

The user configured the environment (takes effect only in a **fresh session**,
which yours should be):

1. Network access → **Custom** → allowlisted `*.supabase.co`.
2. Environment variables set to **staging** values: `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_PUBLISHABLE_KEY` (anon/publishable key — public-safe).

**First thing: confirm they're live** (the prior session predated them, so they
were absent there):

```bash
env | grep VITE_SUPABASE_URL >/dev/null && echo "vars present" || echo "MISSING — not a fresh session"
curl -sS -o /dev/null -w '%{http_code}\n' --max-time 15 "$VITE_SUPABASE_URL/rest/v1/"   # expect 401/200, not 000
```

If those fail, the env changes aren't active — tell the user to start a fresh
session; do not proceed.

## Steps to finish

1. `pnpm install --ignore-scripts` (why: see SKILL.md Gotchas).
2. `pnpm run dev` — works headless now (`host: true` was committed; no `--host`
   needed). Vite reads the `VITE_`-prefixed staging vars from the shell env, so
   **no `.env` file needed**.
3. Drive real data with the existing driver and **look at the screenshots**:
   ```bash
   node .claude/skills/run-upline/driver.mjs / /tmp/home.png
   node .claude/skills/run-upline/driver.mjs /festivals /tmp/festivals.png
   ```
   Confirm real festival/artist data renders (not the "Loading festivals…"
   spinner the placeholder-env approach showed).
4. Rewrite `.claude/skills/run-upline/SKILL.md` Setup/Run sections around
   staging: drop the `cp .env.local.example .env.local` placeholder approach;
   document that staging vars come from the environment config + the
   `*.supabase.co` allowlist. Keep the verified Gotchas. Every command in the
   skill must be one you actually ran this session.
5. Verify per the `verify` skill, then commit + push to
   `claude/skills-command-45yepf` and update PR #96.

## Caveat to document in the skill

Anon access renders **logged-out** views with real data (landing, festival
selection, public pages). Authenticated flows (voting, groups, admin) sit
behind magic-link/OTP — screenshotting those needs a seeded test account +
scripted login. That's a follow-up, not part of this pass.

## Why staging (context you don't need to rediscover)

Full local Supabase is blocked **in this environment**, not by the code:
`supabase start` pulls image layers from CloudFront (`*.cloudfront.net`,
`production.cloudfront.docker.com`) which Trusted network access does not
allow (403). Docker itself works (start `dockerd` manually) and the Supabase
CLI can be built from source (`git clone` + `go build`; the npm postinstall
download is GitHub-403'd), but the image CDN is the wall. Staging avoids all of
it — the app just needs `*.supabase.co` reachable. A Vercel-preview-driven
approach was also considered (needs `*.vercel.app` allowlisted) and is a good
future option, but the user chose the local-staging run.

## Current branch state

- Branch: `claude/skills-command-45yepf`; PR: #96.
- Commits (see `git log origin/main..HEAD`): run-upline skill + driver,
  playwright-cli skill install, `host: true` vite fix.
- What's verified so far: app boots and static routes (`/privacy`, `/terms`)
  render; the driver + Chromium (via `@playwright/test`, `executablePath` from
  `/opt/pw-browsers`) work. NOT yet verified: real data rendering (this pass).
- Skill details, gotchas, and the driver contract are in
  `.claude/skills/run-upline/SKILL.md` — read it rather than re-deriving.

## Suggested skills

- `run-upline` — the skill being finalized; invoke/read it to launch + drive.
- `verify` — exercise the change end-to-end before committing.
- `create-pr` — PR #96 already exists; use its title/description/verification
  conventions when updating.
- `supabase` — if authenticated flows or schema questions come up.

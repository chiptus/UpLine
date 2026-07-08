---
name: run-upline
description: Build, launch, and screenshot the UpLine web app. Use to run, start, serve, drive, or take a screenshot of UpLine locally, or to verify a UI change renders in the real running app.
allowed-tools: Bash(pnpm install*), Bash(pnpm run dev*), Bash(node .claude/skills/run-upline/driver.mjs *), Bash(curl *)
---

# Run UpLine

UpLine is a React + TypeScript + **Vite** SPA (port 8080) backed by Supabase.
Drive it headlessly with `.claude/skills/run-upline/driver.mjs`, which opens a
route in the pre-installed Chromium and writes a screenshot.

All paths below are relative to the repo root.

## Prerequisites

No `apt-get` needed — Node, pnpm, and Chromium (`/opt/pw-browsers`) are already
present. Install deps **with `--ignore-scripts`** (see Gotchas):

```bash
pnpm install --ignore-scripts
```

## Setup

Nothing to do. This environment provides staging Supabase credentials as
`VITE_`-prefixed env vars (in a **fresh session**) plus network access to
`*.supabase.co` — Vite reads them straight from the shell env, no `.env` file
needed. If they're missing (stale session), the app throws at boot — see
Gotchas.

## Run (agent path)

1. Start the dev server (launch in the background):

   ```bash
   pnpm run dev
   ```

   Then wait for readiness:

   ```bash
   for i in $(seq 1 40); do
     [ "$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:8080)" = 200 ] \
       && { echo up; break; }; sleep 1
   done
   ```

2. Drive a route and screenshot it:

   ```bash
   node .claude/skills/run-upline/driver.mjs / /tmp/upline-root.png
   node .claude/skills/run-upline/driver.mjs /festivals/anta /tmp/upline-anta.png
   ```

   `driver.mjs [path] [out.png]` opens `http://127.0.0.1:8080<path>`, waits for
   network idle, writes the screenshot, and prints the title, `#root` child
   count, and any console errors. **Look at the screenshot** — a non-zero
   `#root children` count means React mounted; real festival/artist data
   (not a "Loading festivals…" spinner) confirms staging is actually
   answering. Override the host with `BASE_URL=...`.

Good routes to verify against: `/` lists real festivals (from staging); a
festival slug like `/festivals/anta` renders that festival's real artist
list and set times. `/privacy` and `/terms` are static and render without a
backend at all.

**Caveat — logged-out only:** anon access renders logged-out views (landing,
festival selection, public artist/set pages) with real data. Authenticated
flows (voting, groups, admin) sit behind magic-link/OTP — screenshotting
those needs a seeded test account + scripted login, which this skill doesn't
do yet.

## Run (human path)

Same command: `pnpm run dev` serves at http://localhost:8080. Ctrl-C to stop.

## Gotchas

- **`pnpm install` (without flags) fails.** The `supabase` package's postinstall
  tries to download a CLI binary and dies behind the network proxy, unlinking
  `vite`. Always use `--ignore-scripts`; the web app doesn't need the CLI.
- **Chromium version mismatch.** `driver.mjs` globs
  `/opt/pw-browsers/chromium-*` directly instead of using Playwright's pinned
  build. Don't run `npx playwright install`.
- **Use `@playwright/test`, not `playwright`.** Only `@playwright/test` is a
  dependency here; it re-exports `chromium`.
- **Missing Supabase env vars throw at boot, not a loading spinner.** `#root`
  stays empty with `Error: Missing VITE_SUPABASE_URL...` in the console — means
  a stale session without the staging env vars, not an app bug.
- **Agent proxy resets Chromium's TLS handshake to `*.supabase.co`.**
  `driver.mjs` already launches Chromium with the flags that fix this (see its
  comment) — don't strip them. `ERR_TUNNEL_CONNECTION_FAILED` on
  non-allowlisted hosts (SoundCloud, CloudFront, vercel-scripts) is expected.

## Tests (not run in this session)

`pnpm test` (Vitest unit tests) and `pnpm test:e2e` (Playwright) exist; e2e needs
a local Supabase stack this skill does not stand up. Verify UI changes with the
driver above instead.

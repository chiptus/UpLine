---
name: run-upline
description: Build, launch, and screenshot the UpLine web app. Use to run, start, serve, drive, or take a screenshot of UpLine locally, or to verify a UI change renders in the real running app.
allowed-tools: Bash(pnpm *), Bash(node *), Bash(curl *), Bash(export *), Bash(env *)
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

The app throws at boot if the Supabase env vars are missing. This environment
is configured (in a **fresh session**) with network access to `*.supabase.co`
and staging Supabase credentials as env vars — no `.env` file needed, Vite
reads `VITE_`-prefixed vars straight from the shell env.

**Confirm the prerequisites are live before proceeding:**

```bash
env | grep VITE_SUPABASE_URL >/dev/null && echo "vars present" || echo "MISSING — not a fresh session"
curl -sS -o /dev/null -w '%{http_code}\n' --max-time 15 "$VITE_SUPABASE_URL/rest/v1/"   # expect 401/200, not 000
```

If those fail, the env changes aren't active for this session — start a fresh
one before continuing.

**Var name mismatch:** the app expects `VITE_SUPABASE_PUBLISHABLE_KEY`, but
this environment provides `VITE_SUPABASE_KEY`. Alias it before starting the
dev server:

```bash
export VITE_SUPABASE_PUBLISHABLE_KEY="$VITE_SUPABASE_KEY"
```

## Run (agent path)

1. Start the dev server (launch in the background, in the **same shell** that
   has the `VITE_SUPABASE_PUBLISHABLE_KEY` export — env vars don't persist
   across separate tool calls):

   ```bash
   export VITE_SUPABASE_PUBLISHABLE_KEY="$VITE_SUPABASE_KEY"
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

- **`pnpm install` (without flags) fails.** The `supabase` npm package's
  postinstall downloads a CLI binary from GitHub and dies with a gunzip
  `incorrect header check` behind the network proxy, aborting the whole install
  and leaving `node_modules/.bin` (including `vite`) unlinked. Always use
  `--ignore-scripts`; the web app doesn't need the Supabase CLI.
- **Chromium version is pinned but mismatched.** `@playwright/test` wants build
  1193; the container ships 1194. `driver.mjs` sidesteps this by launching with
  `executablePath` globbed from `/opt/pw-browsers/chromium-*`. Do **not** run
  `npx playwright install`.
- **Use `@playwright/test`, not `playwright`.** Only `@playwright/test` is a
  dependency here; it re-exports `chromium`. Importing `playwright` fails.
- **No live Supabase = perpetual loading + connection-refused console errors.**
  If the staging prerequisites (above) aren't live, expect
  `ERR_CONNECTION_REFUSED` (Supabase `127.0.0.1:54321`) and a permanent
  "Loading festivals…" — not an app bug, just no backend.
- **The agent proxy resets Chromium's TLS handshake to `*.supabase.co`.**
  The proxy re-terminates TLS with its own CA; Chromium's default ClientHello
  (TLS 1.3, ~1.8KB with GREASE/ECH/post-quantum extensions) gets RST'd
  mid-handshake (`net::ERR_CONNECTION_RESET`, net_error -101), and the cert
  isn't trusted either (`ERR_CERT_AUTHORITY_INVALID`). `driver.mjs` already
  launches Chromium with `--ignore-certificate-errors`,
  `--ssl-version-max=tls1.2`, an explicit `--proxy-server`, and a
  `--proxy-bypass-list` for localhost to work around this — don't strip
  those flags. The PostHog "no token" warning and `ERR_TUNNEL_CONNECTION_FAILED`
  on non-allowlisted third-party hosts (SoundCloud avatars, CloudFront,
  vercel-scripts speed-insights) are expected and not app bugs.

## Tests (not run in this session)

`pnpm test` (Vitest unit tests) and `pnpm test:e2e` (Playwright) exist; e2e needs
a local Supabase stack this skill does not stand up. Verify UI changes with the
driver above instead.

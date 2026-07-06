---
name: run-upline
description: Build, launch, and screenshot the UpLine web app. Use to run, start, serve, drive, or take a screenshot of UpLine locally, or to verify a UI change renders in the real running app.
allowed-tools: Bash(pnpm *), Bash(node *), Bash(cp *), Bash(curl *)
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

The app throws at boot if the Supabase env vars are missing. Copy the example
(its defaults point at a local Supabase stack that need not be running — the app
shell and static routes still render):

```bash
cp .env.local.example .env.local
```

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
   node .claude/skills/run-upline/driver.mjs /privacy /tmp/upline-privacy.png
   ```

   `driver.mjs [path] [out.png]` opens `http://127.0.0.1:8080<path>`, waits for
   network idle, writes the screenshot, and prints the title, `#root` child
   count, and any console errors. **Look at the screenshot** — a non-zero
   `#root children` count means React mounted. Override the host with
   `BASE_URL=...`.

Good routes to verify against: `/privacy` and `/terms` are static and render
fully without a backend. `/` (festival selection) renders the shell but shows
"Loading festivals…" until a Supabase backend answers.

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
  That's expected. `ERR_CONNECTION_REFUSED` (Supabase 127.0.0.1:54321) and the
  PostHog "no token" warning are not app bugs.

## Tests (not run in this session)

`pnpm test` (Vitest unit tests) and `pnpm test:e2e` (Playwright) exist; e2e needs
a local Supabase stack this skill does not stand up. Verify UI changes with the
driver above instead.

# Handoff: TanStack Router+Query loader-await change & further checks

**Repo:** `/home/user/UpLine` (`chiptus/upline`)
**Branch:** `claude/tanstack-router-query-stuAq`
**Focus for next session:** apply the loader `await` optimization, then run further validation.

---

## Context in one paragraph

The team's Router+Query refactor (3 efforts: restructure `src/hooks/queries/` →
`src/api/`, router-loader adoption, auth hoist) is **already landed and merged
into this branch** across commits `1b8ce86`..`c2276f1`. A prior session
validated it end-to-end — all gates pass. The only open work is a **performance
refinement to the loaders** and some **remaining checks** the last session did
not run (e2e, real-browser behavior).

Do **not** re-do the refactor. It's done. See these existing artifacts instead
of re-deriving:
- Plan/decisions: `docs/HANDOFF_TANSTACK_ROUTER_QUERY.md` (in-repo, note: its
  header still says "Plan only — no code changes made yet," which is now stale;
  the code shipped).
- Reference blog: https://tkdodo.eu/blog/tan-stack-router-and-query
- Landed work: `git log --oneline 40e81d7..c2276f1` (esp. #90, #97–#103, #102).

## Validation already done (all green — no need to repeat)

- `pnpm run typecheck` (tsc, `tsconfig.app.json`) → 0 errors
- `oxlint .` (489 files) → 0 warnings / 0 errors
- `pnpm exec vitest run` → 311 passed / 20 files
- `pnpm run build` (vite + PWA) → success
- Structural: `src/api/` flat & feature-sliced, `hooks/queries` gone, 0 stale
  imports, 29 `queryOptions` factories, 32 `useSuspenseQuery` (none with a stray
  `enabled:`), auth hoist correct (`__root` `beforeLoad` → `context.user`;
  `onAuthStateChange → router.invalidate()`), global `defaultErrorComponent`.

## Environment gotchas (important)

- **Dev server is always running on port 8080 — do NOT start it** (per CLAUDE.md).
- `node_modules` was NOT committed; install with
  `pnpm install --frozen-lockfile --ignore-scripts`. The `--ignore-scripts` is
  required: the `supabase` CLI postinstall fails on a gunzip/Z_DATA_ERROR when
  fetching its binary. App tooling (tsc/oxlint/vitest/vite) works fine without it.
- Never run `supabase db push` / `supabase db reset` (per CLAUDE.md).

---

## THE CHANGE to make (loader awaits)

**Principle:** `ensureQueryData` warms the Query cache whether or not you
`await`. Since every data-reading component here uses `useSuspenseQuery`, the
`await` is redundant for correctness — it only decides "block navigation (route
pending) vs render-as-you-fetch (Suspense boundary)." Keep the *call*, drop the
*await*, and parallelize independent prefetches.

**Apply to** `src/routes/festivals/$festivalSlug.tsx` (clearest case — currently
3 sequential awaits; only `festival` is a real dependency):

```ts
const festival = await context.queryClient.ensureQueryData(
  festivalBySlugQuery(params.festivalSlug),
);
// warm cache, don't block — useSuspenseQuery handles arrival
void context.queryClient.ensureQueryData(festivalInfoQuery(festival.id));
void context.queryClient.ensureQueryData(customLinksQuery(festival.id));
```

**MUST keep awaited (verified data dependencies / useLoaderData — do NOT touch):**
- `src/routes/festivals/$festivalSlug/editions/$editionSlug.tsx`: `beforeLoad`
  awaits `editionBySlugQuery` because the `loader` needs `context.edition.id`.
- `src/routes/groups/$groupSlug.tsx`: awaits `groupBySlugQuery` because
  `group.id` feeds `groupMembersQuery`/`groupInvitesQuery`.
- `src/routes/admin/festivals/$festivalSlug/editions/$editionSlug/import.tsx`:
  returns the promise and reads it via `Route.useLoaderData()`.

**Other candidates to sweep** (any loader that `ensureQueryData`s a query whose
result it does NOT reference and whose component uses `useSuspenseQuery`):
`grep -rn "ensureQueryData" src/routes`. Confirm per-route that (a) the awaited
value isn't used later in the loader and (b) the consuming component uses
`useSuspenseQuery`, before de-awaiting.

**Deliberate caveat to confirm with the user:** de-awaiting shifts UX from a
full-route spinner (`RouteLoadingFallback`) to per-section Suspense fallbacks.
That's only nicer where a *local* `<Suspense>` boundary exists (e.g.
`src/pages/groups/Groups.tsx` wraps `GroupsList`). A bare `useSuspenseQuery` with
no nearer boundary still bubbles to the route pending component — same blocking
feel. Check boundary placement per de-awaited route.

## FURTHER CHECKS still outstanding

1. **e2e tests** (`pnpm run test:e2e`, Playwright) — NOT run last session
   (needs local Supabase; may need `pnpm run test:setup`). Chromium is
   pre-installed at `/opt/pw-browsers/chromium`; do not run `playwright install`.
2. **Real-browser smoke** of navigation/preload after the change — verify
   render-as-you-fetch actually shows partial UI + Suspense fallbacks and no
   waterfall regressions. Use the `verify` or `run` skill against the
   already-running :8080 server.
3. **Optional, flagged earlier (not yet acted on):** `onAuthStateChange` calls
   `router.invalidate()` on *every* event incl. `TOKEN_REFRESHED`/
   `INITIAL_SESSION`; consider narrowing to `SIGNED_IN`/`SIGNED_OUT`. Discuss
   before changing — it's a judgment call, not a bug.

## After the change

- Auto-commit per CLAUDE.md (conventional commit, e.g.
  `perf(router): parallelize non-dependent loader prefetches`).
- Re-run: `typecheck`, `oxlint .`, `vitest run`, `build`.
- Push: `git push -u origin claude/tanstack-router-query-stuAq`.
- Only open a PR if the user explicitly asks. If they do, follow
  `.claude/skills/create-pr/SKILL.md` exactly.

---

## Suggested skills for the next agent

- **`code-review`** — review the loader diff for correctness (esp. that no
  de-awaited value is actually consumed downstream).
- **`verify`** (or **`run`**) — drive the app at :8080 to confirm the
  render-as-you-fetch behavior and catch loading regressions.
- **`create-pr`** — only if the user asks to open/update a PR.
- **`tdd`** — if any new loader/suspense behavior warrants a test.

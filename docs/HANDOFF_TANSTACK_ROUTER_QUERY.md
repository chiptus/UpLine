# Handoff: Adopt TanStack Router + Query patterns

**Branch:** `claude/tanstack-router-query-stuAq`
**Status:** Plan only — no code changes made yet.
**Reference:** [TkDodo — "TanStack Router and Query"](https://tkdodo.eu/blog/tan-stack-router-and-query)

This document hands off a migration to deepen the integration between TanStack
Router and TanStack Query, following TkDodo's recommended patterns. Read it
top-to-bottom before touching code; the **Caveats** section is load-bearing.

---

## TL;DR

The app is already on TanStack Router (file-based routing, `routeTree.gen.ts`)
and the *basic* Router+Query wiring exists. What's missing are the three deeper
patterns from the blog:

1. `queryOptions()` factories (single source of truth for a query) — **0 usages today**
2. Route `loader`s prefetching via `queryClient.ensureQueryData` — **only 2 of ~80 routes**
3. `useSuspenseQuery` in components — **0 usages today**

Goal: remove the duplication between query hooks and loaders, and let data load
through the router (prefetch in loader → guaranteed-available data in component),
while keeping TanStack Query as the cache / source of truth.

---

## Current state (verified)

Already in place:

- ✅ `QueryClient` passed via router `context` — `src/main.tsx`
  ```ts
  const router = createRouter({ routeTree, context: { queryClient }, defaultPreload: "intent", ... });
  ```
- ✅ `createRootRouteWithContext<{ queryClient: QueryClient }>()` — `src/routes/__root.tsx`
- ✅ Query-key factories per feature — e.g. `src/hooks/queries/festivals/types.ts` (`festivalsKeys`)
- ✅ `fetchX` functions separated from `useXQuery` hooks — e.g. `fetchFestivalBySlug` in `useFestivalBySlug.ts`
- ✅ `defaultPreload: "intent"` and global `defaultPendingComponent: RouteLoadingFallback`, `defaultNotFoundComponent: NotFound`

Not yet adopted:

- ❌ `queryOptions()` factories (`grep -rn "queryOptions(" src` → 0)
- ❌ `useSuspenseQuery` (`grep -rn "useSuspenseQuery" src` → 0)
- ❌ Loaders only on 2 routes:
  - `src/routes/festivals/$festivalSlug.tsx`
  - `src/routes/admin/festivals/$festivalSlug/editions/$editionSlug/import.tsx`

Both existing loaders **inline** `{ queryKey, queryFn }`, duplicating what the
hooks already define — exactly the duplication `queryOptions` removes.

### Scale
~73 files under `src/hooks/queries/`, ~80 route files under `src/routes/`.

---

## Guiding principles (from the post)

- **Router and Query are complementary.** Router owns URL state + *when* to load
  (loaders); Query owns caching, dedup, background refetch, invalidation. Don't
  move server-cache concerns into loaders.
- **One definition per query** via `queryOptions()` — the same object feeds
  `ensureQueryData` (loader) and `useSuspenseQuery` / `useQuery` (component).
- **`ensureQueryData` in loaders**, not `prefetchQuery` — it returns data and
  surfaces errors to the router error boundary.
- **`useSuspenseQuery` in components** so data is non-nullable; pair with route
  `pendingComponent` (already global) and an `errorComponent`.

---

## Phase 0 — Foundations (low risk, do first)

1. **Confirm `staleTime`.** `main.tsx` sets `queries.staleTime: 5_000`. A
   non-trivial `staleTime` keeps loader-prefetched data from instantly
   refetching on mount. Confirm 5s is intended or override per-query in the
   factory.

2. **Pick where `queryOptions` factories live.** Recommendation: co-locate in
   each feature's existing `types.ts` (already holds key factories). Example:
   ```ts
   // src/hooks/queries/festivals/types.ts
   import { queryOptions } from "@tanstack/react-query";
   import { fetchFestivalBySlug } from "./useFestivalBySlug";

   export const festivalQueries = {
     bySlug: (slug: string) =>
       queryOptions({
         queryKey: festivalsKeys.bySlug(slug),
         queryFn: () => fetchFestivalBySlug(slug),
       }),
   };
   ```
   ⚠️ **Import-cycle risk:** `types.ts` importing from `useFestivalBySlug.ts`,
   which imports from `types.ts`. Cleanest fix: move each `fetchX` function
   *into* `types.ts` (or a sibling `api.ts`) and have the `useXQuery` hook import
   the factory. **Lock this structural decision in before scaling.**

3. **Repoint hooks to consume the factory** so there's exactly one definition:
   ```ts
   export function useFestivalBySlugQuery(slug?: string) {
     return useQuery({ ...festivalQueries.bySlug(slug!), enabled: !!slug });
   }
   ```

---

## Phase 1 — Pilot vertical slice (festival → edition → set)

Convert one complete path end-to-end as the reference implementation:

- `src/routes/festivals/$festivalSlug.tsx` — already has a loader; switch it to
  `context.queryClient.ensureQueryData(festivalQueries.bySlug(params.festivalSlug))`.
- `.../editions/$editionSlug.tsx` — add loader using an `editionQueries` factory.
- A leaf such as `.../sets/$setSlug.tsx` — in the component, replace
  `useSetBySlug` (`useQuery`) with `useSuspenseQuery(setQueries.bySlug(...))` and
  delete the null-guards.
- Add an `errorComponent` to these routes (today they lean only on the global
  not-found + pending components).
- Verify preloading: `defaultPreload: "intent"` means hovering a link warms the
  cache via the loader.

This slice is the thing reviewers sign off on before rollout.

---

## Phase 2 — Roll out by feature folder

Apply the Phase 0/1 template feature-by-feature, leaf-data first (fewest
dependents):

1. `festivals`, `festivals/editions`
2. `sets`, `stages`, `genres`
3. `festival-info`, `custom-links`, `knowledge`
4. `artists` (+ `artists/notes`)
5. `groups` (+ `groups/invites`), `voting`
6. `auth` (see caveat 1)

Per feature: add `queryOptions` factory → repoint the hook → add `loader` +
`ensureQueryData` to the owning route(s) → switch required reads to
`useSuspenseQuery` → add `errorComponent`.

---

## Phase 3 — Cleanup & guardrails

- Remove dead null-checks / `enabled` guards that only existed because data could
  be `undefined`.
- Update `CLAUDE.md` data-fetching guideline (point 4) to describe the
  loader-prefetch pattern; optionally add a convention: "queries consumed by a
  route with a loader should use a `queryOptions` factory + `useSuspenseQuery`."

---

## Caveats specific to this codebase (read these)

1. **Auth-dependent queries can't be naively prefetched in loaders.**
   `useProfile`, `useUserPermissions`, `useUserVotes`, `useGroupVotes` depend on
   the authenticated user, which comes from `AuthContext` rendered *inside*
   `__root`'s component — not available in loaders. Options: keep these as
   `useQuery` (no loader prefetch), **or** resolve auth/session into the router
   context via `beforeLoad` so `context.user` is available to loaders.
   **Recommendation: leave auth queries as-is in the first pass.**

2. **`enabled` queries don't map to `useSuspenseQuery`.** Anywhere a query is
   conditional (`enabled: !!x`), suspense is wrong — keep `useQuery`. Many hooks
   use this pattern.

3. **Realtime subscriptions** write into the Query cache (per CLAUDE.md). The
   behavior is unaffected, but confirm `staleTime` doesn't fight live updates.

4. **Subdomain `rewrite` logic** in `main.tsx` makes `$festivalSlug` implicit on
   `*.getupline.com`. Loaders read `params.festivalSlug` — verify rewrites
   populate params correctly under preload/suspense.

5. **No `export ... from` and no barrel files** (CLAUDE.md). Import
   `queryOptions` factories directly from each `types.ts`.

---

## Project conventions to honor (from CLAUDE.md)

- Function declarations, not arrow consts, for components/named functions.
- Query hooks end in `Query`, mutation hooks end in `Mutation`.
- Prefer `mutation.mutate(vars, { onSuccess, onError })` over `await mutateAsync`
  in try/catch.
- No comments unless necessary; no barrel exports.
- Auto-commit code changes per user message.

---

## Effort estimate

~73 hooks + ~80 routes. Phase 0–1 is ~½ day and de-risks the rest; Phases 2–3
are mechanical and parallelizable by feature folder.

## Quick verification commands

```bash
grep -rn "queryOptions(" src        # factory adoption
grep -rn "useSuspenseQuery" src     # component adoption
grep -rln "loader:" src/routes      # routes with prefetch
```

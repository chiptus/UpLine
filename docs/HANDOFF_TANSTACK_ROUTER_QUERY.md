# Handoff: API modules + TanStack Router/Query adoption

**Branch:** `claude/tanstack-router-query-stuAq`
**Status:** Plan only — no code changes made yet.
**Reference:** [TkDodo — "TanStack Router and Query"](https://tkdodo.eu/blog/tan-stack-router-and-query)

This plan was refined in a grilling session. It now has **three sequential
efforts**, not one. Read top-to-bottom before touching code; the **Caveats** and
**Decisions** sections are load-bearing.

---

## TL;DR

The app is already on TanStack Router (file-based routing, `routeTree.gen.ts`)
with basic Router+Query wiring. Three deeper patterns from the blog are missing
(`queryOptions` factories, loader prefetch via `ensureQueryData`,
`useSuspenseQuery`), and adopting them well first means **restructuring the data
layer** into self-contained, feature-sliced API modules.

The work is split into three efforts, done in order:

1. **Restructure** `src/hooks/queries/` → `src/api/` (mechanical, no behavior change)
2. **Router adoption** — loaders + `useSuspenseQuery` per feature
3. **Auth hoist** — session into router context so auth queries can prefetch

Each effort is done **feature-by-feature**, and the three efforts are kept
**separate** (don't bundle a restructure and a router change in one slice).

---

## Current state (verified)

Already in place:

- ✅ `QueryClient` passed via router `context`, `defaultPreload: "intent"`,
  `defaultPreloadStaleTime: 0` — `src/main.tsx`
- ✅ `createRootRouteWithContext<{ queryClient: QueryClient }>()` — `src/routes/__root.tsx`
- ✅ Global `defaultPendingComponent: RouteLoadingFallback`, `defaultNotFoundComponent: NotFound`
- ✅ Query-key factories per feature — e.g. `festivalsKeys` in `src/hooks/queries/festivals/types.ts`
- ✅ `fetchX` functions separated from `useXQuery` hooks — e.g. `fetchFestivalBySlug`

Not yet adopted (verified counts):

- ❌ `queryOptions()` factories — **0 usages**
- ❌ `useSuspenseQuery` — **0 usages**
- ❌ Loaders on only **2** routes, both inlining `{ queryKey, queryFn }`:
  - `src/routes/festivals/$festivalSlug.tsx`
  - `src/routes/admin/festivals/$festivalSlug/editions/$editionSlug/import.tsx`

### Scale

- **73** files under `src/hooks/queries/`
- **31** route files (`*.tsx`) under `src/routes/`
- **25** files in `src/hooks/queries/` use an `enabled:` guard (conditional queries)
- `staleTime: 5_000` global default in `main.tsx`

---

## Decisions (locked in the grilling session)

### Target structure: `src/api/`, feature-sliced, flattened

- The data layer moves from `src/hooks/queries/` to **`src/api/`**. It is the
  central data-access module; it no longer lives under `hooks/` because each
  file is now more than a hook.
- **Flat**: one directory per feature. Today's nested sub-features are promoted
  to top-level siblings:
  - `festivals/editions/` → `editions/`
  - `artists/notes/` → `artist-notes/`
  - `groups/invites/` → `invites/`
  - The two loose root files (`useAdminRolesQuery.ts`, `useInviteValidationQuery.ts`)
    get their own feature folders.

### Per-feature layout

```
src/api/festivals/
  types.ts              // entity Row type (Festival) + key factory (festivalsKeys)
  useFestivalBySlug.ts  // per-endpoint types + fetch + queryOptions factory + hook
  useFestivals.ts
  useCreateFestival.ts
  ...
```

- **`types.ts` (shared, per feature):** holds the entity Row type (`Festival`,
  imported by ~10+ UI files outside the folder) **and** the query-key factory
  (`festivalsKeys`, shared across endpoints and across features — e.g. edition
  mutations invalidate `festivalsKeys.all()`).
- **One file per endpoint**, keeping the existing **`use`-prefixed filename**
  (`useFestivalBySlug.ts`). Each file is self-contained and holds, together:
  1. the endpoint's own request/response types (e.g. `CreateFestivalInput`)
  2. the `fetchX` / mutate function
  3. a **per-file `queryOptions` factory export** (e.g. `festivalBySlugQuery(slug)`)
  4. the hook, consuming its own factory

  ```ts
  // src/api/festivals/useFestivalBySlug.ts
  import { queryOptions, useQuery } from "@tanstack/react-query";
  import { supabase } from "@/integrations/supabase/client";
  import { Festival, festivalsKeys } from "./types";

  export async function fetchFestivalBySlug(slug: string): Promise<Festival> {
    const { data, error } = await supabase
      .from("festivals").select("*")
      .eq("archived", false).eq("slug", slug).single();
    if (error) throw new Error("Failed to load festival");
    return data;
  }

  export function festivalBySlugQuery(slug: string) {
    return queryOptions({
      queryKey: festivalsKeys.bySlug(slug),
      queryFn: () => fetchFestivalBySlug(slug),
    });
  }

  export function useFestivalBySlugQuery(slug: string | undefined) {
    return useQuery({ ...festivalBySlugQuery(slug!), enabled: !!slug });
  }
  ```

  This breaks the import cycle the original plan worried about: the factory and
  the hook live together, and both import keys/types from the pure `types.ts`.

### Sequencing: three separate, vertical efforts

1. **Effort 1 — Restructure** (`src/hooks/queries/` → `src/api/`). Feature by
   feature: move files, add per-file `queryOptions` factories, repoint hooks to
   consume their own factory, update consumer import paths. **No behavior
   change.** This is the big mechanical, reviewable diff.
2. **Effort 2 — Router adoption.** Feature by feature: add route `loader`s using
   `context.queryClient.ensureQueryData(theQueryFactory(...))`, convert eligible
   reads to `useSuspenseQuery`, add an `errorComponent`. `enabled`/conditional
   queries stay `useQuery` (see caveat 2).
3. **Effort 3 — Auth hoist** (enables auth-dependent queries in the router). See
   below; tracked as its own follow-up ticket (#50).

Restructure slices land first; router slices follow. Do **not** combine a
feature's restructure and its router change in the same slice.

### Auth hoist (Effort 3)

Auth-dependent queries (`useProfile`, `useUserPermissions`, `useUserVotes`,
`useGroupVotes`) can't prefetch in loaders today because `AuthProvider` (and the
`user` it owns) is rendered *inside* `__root`'s component, below the router.

Decision: **the router resolves the session independently; `AuthProvider` stays
fully intact.**

- Root `beforeLoad` calls `supabase.auth.getSession()` to put `user` in
  `context.user`, making it available to loaders.
- A router-side `supabase.auth.onAuthStateChange` listener calls
  `router.invalidate()` for reactivity (login/logout re-runs `beforeLoad` +
  loaders).
- `AuthProvider` is **not** changed: it keeps its own session state, `profile`,
  `needsOnboarding`, the `AuthDialog` modal, `SIGNED_IN` invite processing, and
  `signOut`. The **23 `useAuth` consumers are untouched.**
- Both the router and `AuthProvider` project from the supabase client (the real
  source of truth). This accepts a second `getSession`/listener as the deliberate
  price of keeping the heavily-used provider risk-free.

---

## Guiding principles (from the post)

- **Router and Query are complementary.** Router owns URL state + *when* to load
  (loaders); Query owns caching, dedup, background refetch, invalidation.
- **One definition per query** via `queryOptions()` — the same object feeds
  `ensureQueryData` (loader) and `useSuspenseQuery` / `useQuery` (component).
- **`ensureQueryData` in loaders**, not `prefetchQuery` — it returns data and
  surfaces errors to the router error boundary.
- **`useSuspenseQuery` in components** so data is non-nullable; pair with route
  `pendingComponent` (already global) and an `errorComponent`.

---

## Phase plan

### Effort 1 — Restructure (do first, per feature)

Suggested order, leaf-data first (fewest dependents):

1. `festivals`, `editions`
2. `sets`, `stages`, `genres`
3. `festival-info`, `custom-links`, `knowledge`
4. `artists` (+ `artist-notes`)
5. `groups` (+ `invites`), `voting`
6. `auth`, plus loose `admin-roles` / `invite-validation`

Per feature: create `src/api/<feature>/`, move files, add per-file
`queryOptions` factory, repoint the hook to consume it, fix consumer imports.
Verify build + tests green; no behavior should change.

### Effort 2 — Router adoption (per feature, after Effort 1)

Per feature, on routes that own the data:

- Add `loader` using `context.queryClient.ensureQueryData(factory(...))`.
- Replace non-conditional `useQuery` reads with `useSuspenseQuery(factory(...))`;
  delete the null-guards that only existed because data could be `undefined`.
- Add an `errorComponent` to the route.
- Pilot first slice end-to-end: festival → edition → set
  (`$festivalSlug` → `$editionSlug` → `$setSlug`). This is the reference
  implementation reviewers sign off on before rollout.

### Effort 3 — Auth hoist (separate; tracked in #50)

Build per the **Auth hoist** decision above. The router resolves the session
independently and `AuthProvider` stays intact, so the 23 `useAuth` consumers
need no changes. Sequence the reactivity carefully (`router.invalidate()` on
auth state change).

### Cleanup & guardrails (after each effort)

- Remove dead null-checks / `enabled` guards that only existed because data could
  be `undefined` (Effort 2 only).
- Update `CLAUDE.md`: point data-fetching guidance at `src/api/` and the
  loader-prefetch pattern.

---

## Caveats specific to this codebase (read these)

1. **Auth-dependent queries** — addressed by Effort 3. Until then they stay
   `useQuery` (no loader prefetch).
2. **`enabled` queries don't map to `useSuspenseQuery`.** 25 files use the
   pattern; conditional queries keep `useQuery` even after the router pass.
3. **Realtime subscriptions** write into the Query cache (per CLAUDE.md).
   Confirm `staleTime` doesn't fight live updates.
4. **Subdomain `rewrite` logic** in `main.tsx` makes `$festivalSlug` implicit on
   `*.getupline.com`. Loaders read `params.festivalSlug` — verify rewrites
   populate params correctly under preload/suspense.
5. **No `export ... from` and no barrel files** (CLAUDE.md). Import factories
   directly from each endpoint file.

---

## Open questions (resolve at build time)

- **`staleTime`.** Global is `5_000`. Confirm it's intended, or override
  per-query in factories so loader-prefetched data doesn't instantly refetch.
- **`errorComponent`: global vs per-route.** Today routes lean only on the global
  not-found + pending components. Decide whether to add a global default error
  component or wire them per-route in Effort 2.
- **Auth reactivity mechanics.** Exact `router.invalidate()` wiring and where the
  `onAuthStateChange` subscription lives once `AuthProvider` is narrowed.

---

## Project conventions to honor (from CLAUDE.md)

- Function declarations, not arrow consts, for components/named functions.
- Query hooks end in `Query`, mutation hooks end in `Mutation`.
- Prefer `mutation.mutate(vars, { onSuccess, onError })` over `await mutateAsync`
  in try/catch.
- No comments unless necessary; no barrel exports; import directly from file path.
- Auto-commit code changes per user message.

---

## Effort estimate

73 endpoint files + 31 routes. Effort 1 (restructure) is the bulk but mechanical
and parallelizable by feature folder. Effort 2 is route-by-route. Effort 3 (auth
hoist) is small in files but high in care.

## Quick verification commands

```bash
grep -rn "queryOptions(" src        # factory adoption
grep -rn "useSuspenseQuery" src     # component adoption
grep -rln "loader:" src/routes      # routes with prefetch
```

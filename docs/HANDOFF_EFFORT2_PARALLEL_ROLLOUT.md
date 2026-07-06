# Handoff: Effort 2 rollout (router adoption), remaining features, parallelized

**For:** a fresh session/agent picking up where this one left off.
**Focus of next session (per user):** take the rest of Effort 2 (#53) and do it with parallel agents — one per remaining feature slice.

---

## Where things stand

- Epic: #51. Effort 1 (restructure to `src/api/`) is done and merged.
- Effort 2 (#53): the **pilot slice** (`festivals` + `editions` + `sets`) is done and merged — **PR #90**, branch `claude/router-adoption-pilot-b0sv21` (already merged, do not reopen or reuse this branch).
- PR #90 is the **reference implementation** for every pattern decision below — read its final diff before starting any new slice. It also contains a long, substantive review thread (chiptus) that overturned my first two attempts at one sub-problem; the lessons from that thread are distilled below so they aren't rediscovered the hard way again.
- Remaining checklist items on #53 (leaf-first order, per the issue body):
  - [ ] `stages`
  - [ ] `genres`
  - [ ] `festival-info`
  - [ ] `custom-links`
  - [ ] `artists` (+ `artist-notes`)
  - [ ] `groups` (+ `invites`)
  - [ ] `voting` — **stays deferred**, it's auth-dependent (`useUserVotes`/`useGroupVotes`) and can't prefetch in a loader until Effort 3 (#50, auth hoist into router context) lands. Do not attempt it this round.
  - `knowledge` was already dropped from the checklist in Effort 1 (dead code).
- Two open questions from #53 are already resolved and don't need revisiting: global `staleTime: 5_000` in `src/main.tsx` is confirmed fine as-is, and a global `defaultErrorComponent` (`src/components/layout/RouteErrorFallback.tsx`, wired in `src/main.tsx`) already exists — reuse it, only add a per-route `errorComponent` if a route genuinely needs bespoke handling.

## The pattern (see PR #90 for the worked example)

Per feature, on routes that own the data:
- Add a route `loader` that calls `context.queryClient.ensureQueryData(factory(...))`, where `factory` is the feature's existing `queryOptions` factory from `src/api/<feature>/use*.ts` (all created in Effort 1 — nothing new to build there).
- In the component, replace `useQuery(...)` + null-guards with `useSuspenseQuery(factory(...))` using the **same factory call** — one definition feeds both the loader and the component. Delete the now-dead loading/not-found branches.
- `enabled`-guarded (conditional) queries **stay `useQuery`** — do not convert them. ~25 files in `src/api/` use this pattern; if a query's inputs can legitimately be absent (not just "not loaded yet"), leave it alone.

## Hard-won lessons from PR #90's review (read before implementing, not after)

These came out of a real back-and-forth with the human reviewer and each one cost a revert — don't relitigate them:

1. **Don't thread data through a React Context that's nullable for a good reason.** `FestivalEditionContext`'s `edition` is `FestivalEdition | null` because it's shared with the edition-selection page (`/festivals/$festivalSlug/index.tsx`) where no edition is picked yet. That nullability is load-bearing, not a leftover guard — leave that context alone.
2. **Do use TanStack Router's own route context for guarantees a specific route subtree can make.** When an ancestor route's `beforeLoad`/`loader` has already resolved something and every descendant route is guaranteed to have it (e.g. `editions/$editionSlug`'s `beforeLoad` guarantees `edition` for everything nested under it), return it from `beforeLoad` (`return { edition }`) and read it downstream via `useRouteContext({ from })`. This is a *different* mechanism from (1) and doesn't conflict with it — it solves a problem the React Context structurally can't (giving descendants a **typed non-null** guarantee).
3. **Point `useRouteContext`'s `from` at the leaf route you're already using for `useParams`, not the ancestor that introduced the field.** Route context inherits down the tree, so the leaf's merged context already has it.
4. **Never let a fetch function bypass the query cache to resolve a dependency that's already been prefetched.** One attempt in this thread had `fetchSetBySlug` call `fetchFestivalEditionBySlug` directly (a raw, uncached Supabase call) to resolve an edition id — that turned a cheap cache hit into two real duplicate network round-trips. If a loader needs data an ancestor already ensured, read it via `ensureQueryData(sameFactory(...))` (cache-aware) or via route context (mechanism 2), never a raw fetch chain.
5. A "redundant-looking" `ensureQueryData(factory(...))` call is often *not* actually wasteful — React Query dedupes/caches it. Don't over-optimize it away by reintroducing (1) or (4).

## Conventions already in force (CLAUDE.md, unchanged by this work)

- Function declarations, not arrow consts, for components/named functions.
- Query hooks end in `Query`, mutation hooks end in `Mutation`.
- No barrel exports (`export ... from`); import directly from file path.
- `mutation.mutate(vars, { onSuccess, onError })`, not `await mutateAsync` in try/catch.
- id-normalization uses the non-null `!` assertion where genuinely route-guaranteed (tracked in #70) — but prefer a typed guarantee via route context (lesson 2 above) over a blind `!` when one's cheaply available, as PR #90 ended up doing.
- **PR creation**: CLAUDE.md now has an explicit rule (added this session, after a real slip-up) to Read `.claude/skills/create-pr/SKILL.md` directly and follow its title/description/verification format exactly, regardless of how the PR-creation task was triggered. Don't rely on a paraphrased summary of it.
- Auto-commit after every code-changing exchange (existing CLAUDE.md rule).

## Suggested parallelization approach

The remaining six features are largely independent verticals (different route files, different `src/api/<feature>/` folders), so they parallelize well — but:
- Each agent should work in its own git worktree/branch to avoid clobbering others' in-flight edits, then a human/orchestrator merges each as its own PR (matching the "each feature is its own slice" rule already established in the epic).
- None of them should need to touch `FestivalEditionContext`, `src/main.tsx`, or the already-merged pilot's files — if an agent finds itself wanting to, stop and reconsider (see lesson 1).
- `artists` explicitly bundles `artist-notes` (per the checklist), and `groups` bundles `invites` — keep those pairs together per agent, don't split them further.
- Give each agent PR #90's diff (or this doc's "hard-won lessons" section) as required reading before it starts, not just the abstract pattern description — the lessons are non-obvious and each was reverted at least once in practice.
- Suggest reviewing each finished slice against the lessons above before opening its PR, to cut down the review round-trips seen on #90.

## Suggested skills for the next session

- **`create-pr`** — mandatory before opening/updating any PR for these slices (see CLAUDE.md rule above); Read `.claude/skills/create-pr/SKILL.md` directly, don't paraphrase it.
- **`code-review`** — run on each feature's diff before opening its PR, given how much back-and-forth the pilot's review needed; catching the "redundant fetch" / "unsafe assertion" smells locally first should reduce reviewer round-trips.
- **`verify`** — each slice touches real routes/loaders; drive the actual page (festival → edition → the feature's page) rather than relying on typecheck/tests alone, per this repo's general verification guidance.

## References (don't re-derive, just read)

- Original plan: `docs/HANDOFF_TANSTACK_ROUTER_QUERY.md`
- Effort 1 ADR: `docs/adr/0001-api-modules.md`
- Epic: https://github.com/chiptus/UpLine/issues/51
- This effort's tracking issue (checklist, open questions — both resolved): https://github.com/chiptus/UpLine/issues/53
- Reference implementation + full review discussion: https://github.com/chiptus/UpLine/pull/90 (merged)
- Auth hoist (blocks `voting`): https://github.com/chiptus/UpLine/issues/50

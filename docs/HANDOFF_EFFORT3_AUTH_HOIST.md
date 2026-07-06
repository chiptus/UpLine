# Handoff: Effort 3 — hoist auth into router context (#50), then finish Effort 2's auth-dependent slices

**For:** a fresh session/agent picking up #50 and the two Effort 2 features it unblocks.

---

## Where things stand

- Epic: **#51**. Effort 1 (`src/api/` restructure) is merged.
- Effort 2 (**#53**, route loaders + `useSuspenseQuery` per feature) — **all non-auth slices are merged**:
  - pilot `festivals`+`editions`+`sets` — #90 (the reference implementation)
  - `stages` — #100, `genres` — #97, `festival-info` — #101, `custom-links` — #98, `artists`(+`artist-notes`) — #99
  - `knowledge` was dropped in Effort 1 (dead code).
- **Blocked on this effort:** `groups` (+ `invites`) and `voting`. #53 stays **open** until they land.
- This effort = **#50**: hoist the auth session into TanStack Router context so loaders can prefetch auth-dependent queries.

## The problem (#50)

Auth-dependent queries can't prefetch in loaders because `AuthProvider` — and the `user` it owns — renders **inside** `__root`'s component, below the router. Router context today is only `{ queryClient }` (see `createRootRouteWithContext<RouterContext>` in `src/routes/__root.tsx` and `context: { queryClient }` in `src/main.tsx`). So `context.user` isn't available to loaders, and queries keyed on `userId` stay `useQuery`.

## The decision — already made in a grilling session (see #50, do NOT relitigate)

The router resolves the session **independently**; `AuthProvider` stays **fully intact**:

- Root `beforeLoad` calls `supabase.auth.getSession()` to put `user` into `context.user`, making it available to loaders.
- A router-side `supabase.auth.onAuthStateChange` listener calls `router.invalidate()` for reactivity (login/logout re-runs `beforeLoad` + loaders).
- `AuthProvider` is **not** changed: it keeps its own session state, `profile`, `needsOnboarding`, the `AuthDialog` modal, `SIGNED_IN` invite processing, and `signOut`. The **~23 `useAuth` consumers are untouched.**
- Both the router and `AuthProvider` project from the supabase client (the real source of truth). This deliberately accepts a second `getSession`/listener as the price of keeping the heavily-used provider risk-free.

## Implementation sketch (verify against TanStack Router's "auth in context" docs; not prescriptive)

1. Extend `RouterContext` in `src/routes/__root.tsx` to include `user: User | null` (from `@supabase/supabase-js`).
2. Add a **root-level `beforeLoad`** in `__root.tsx`:
   `const { data: { session } } = await supabase.auth.getSession(); return { user: session?.user ?? null };`
   Root `beforeLoad` runs per navigation; `getSession()` reads local storage (cheap, no network after init) — confirm acceptable.
3. In `src/main.tsx`, pass an initial `user: null` in the `createRouter` `context`, and after `createRouter` wire reactivity:
   `supabase.auth.onAuthStateChange(() => router.invalidate())`. Decide where this subscription lives and how it's cleaned up. It's independent of `AuthProvider`'s own listener — `invalidate()` just re-runs loaders; make sure the two don't fight (they shouldn't).
4. Typecheck: loaders and `useRouteContext` can now read `context.user`.

## Then: finish Effort 2's two remaining slices (same pattern as #90)

Read `docs/HANDOFF_TANSTACK_ROUTER_QUERY.md` and PR #90's diff first. Keep the pairs together (`groups`+`invites`) and **one PR per feature** (don't bundle groups with voting).

### groups (+ invites)
- Routes with no loader today: `/groups/` (`src/routes/groups/index.tsx` → `Groups.tsx`) and `/groups/$groupSlug` (`src/routes/groups/$groupSlug.tsx` → `GroupDetail.tsx`).
- Now-prefetchable entry queries: `userGroupsQuery(userId)` (`src/api/groups/useUserGroups.ts`), `groupBySlugQuery(slug, userId)` (`src/api/groups/useGroupBySlug.ts`). Downstream: `groupDetailQuery(groupId)`, `groupMembersQuery(groupId)`, `groupInvitesQuery(groupId)` (`src/api/invites/useGroupInvites.ts`).
- Pattern: `/groups/` loader → `ensureQueryData(userGroupsQuery(context.user.id))`, `Groups.tsx` → `useSuspenseQuery`. `/groups/$groupSlug` loader → `ensureQueryData(groupBySlugQuery(params.groupSlug, context.user.id))`; get `groupId` from that **via the cache/route context, not a raw refetch** (lesson 4), then `ensureQueryData(groupMembersQuery(groupId))` / `groupInvitesQuery(groupId)`. Convert `GroupDetail.tsx` + `InviteManagement.tsx`.
- **Leave** the auth consumers that render for a possibly-signed-out user (`SetGroupVoting`, `GroupFilterDropdown` on the set/edition pages) as `useQuery` — `enabled`-guarded stays.

### voting
- Queries: `userVotesQuery(userId)` (`src/api/voting/useUserVotes.ts`), `groupVotesQuery(setId, groupId)` (`src/api/voting/useGroupVotes.ts`) — both `enabled`-guarded today.
- These render on the set-detail page for a **possibly-signed-out** visitor (anon users have no votes), so they mostly stay `useQuery`. Only convert where a route genuinely **guarantees** a signed-in user. Realistically `voting` may remain `useQuery` even after the hoist — the hoist only makes conversion *possible*. Do **not** force Suspense on a query that's legitimately absent for anon users. Confirm with the reviewer whether any voting route mandates auth.

## Hard-won lessons from PR #90's review (each cost a revert — don't relitigate)

1. Don't thread data through a React Context that's nullable for a good reason (`FestivalEditionContext.edition` is `| null`, shared with the edition-selection page). Leave that context alone.
2. Do use Router route context for guarantees a subtree can make (an ancestor `beforeLoad` `return`s the value; read it via `useRouteContext({ from })`). This is how `context.user` will now work for the groups routes.
3. Point `useRouteContext`'s `from` at the leaf route you already use for `useParams`, not the ancestor that introduced the field.
4. Never let a fetch function bypass the query cache to resolve an already-prefetched dependency (no raw Supabase re-fetch to re-resolve an id). Use `ensureQueryData(sameFactory(...))` or route context.
5. A "redundant-looking" `ensureQueryData(factory(...))` is usually fine — React Query dedupes/caches it. Don't over-optimize it away by reintroducing (1) or (4).
6. `enabled`/conditional queries stay `useQuery`. If an input can legitimately be absent (anon user, nullable shared context), leave it. Only convert where the route guarantees the input.

## Conventions (CLAUDE.md)

- Function declarations, not arrow consts. Query hooks end in `Query`, mutations in `Mutation`. No barrel exports. `mutation.mutate(vars, { onSuccess, onError })`. No comments unless necessary.
- **PR creation:** Read `.claude/skills/create-pr/SKILL.md` **directly** and follow its title/description/verification format exactly — don't paraphrase.
- Auto-commit after every code-changing exchange. One PR per feature (don't bundle groups + voting).

## Env / verify notes (this repo)

- `pnpm install` needs `--ignore-scripts` here — the `supabase` package's postinstall fails downloading a binary through the sandbox proxy; irrelevant to build/lint/test.
- Verify with `pnpm run build && pnpm run lint && pnpm test` (311-test baseline). Drive the real flow (sign in → `/groups` → a group; sign in → set page voting) per the repo's verification guidance — don't rely on typecheck/tests alone.
- Don't run the dev server (the user always has it running). Never run `supabase db push` or `supabase db reset`.

## After both slices land

- Check `groups` + `voting` on **#53** and **close #53** — Effort 2 complete.
- Consider recording the auth-in-router-context decision as an ADR (`docs/adr/`); #50 notes it was intentionally not yet recorded.

## References (read, don't re-derive)

- Auth hoist issue: https://github.com/chiptus/UpLine/issues/50
- Effort 2 tracking (checklist): https://github.com/chiptus/UpLine/issues/53
- Epic: https://github.com/chiptus/UpLine/issues/51
- Original plan: `docs/HANDOFF_TANSTACK_ROUTER_QUERY.md`
- Effort 1 ADR: `docs/adr/0001-api-modules.md`
- Reference implementation + full review discussion: https://github.com/chiptus/UpLine/pull/90 (merged)
- Current auth wiring: `src/contexts/AuthContext.tsx` (provider + `useAuth`), `src/routes/__root.tsx` (router context + `RootComponent`), `src/main.tsx` (`createRouter`).

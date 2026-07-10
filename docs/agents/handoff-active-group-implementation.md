# Handoff: implement the Active Group model + group-vote filtering

## What this session is for

Build what was designed in the 2026-07-10 grilling session: an app-wide **Active Group**, converging the Artists tab's group perspective and a new Schedule-tab group vote-scope on it. Design is settled — this is an implementation session, not a design one. See `CONTEXT.md` (Active Group, Vote Perspective, Vote Scope, Group, Vote) and `docs/adr/0003-active-group-model.md` for the settled vocabulary and reasoning; treat both as fixed constraints.

## Decisions (fixed, do not re-litigate)

1. **Active Group** is one persistent value per user, global across editions (not per-edition), stored as `profiles.active_group_id` (new column, `UUID REFERENCES groups(id) ON DELETE SET NULL`, nullable). `profiles` currently has `id, username, email, completed_onboarding` — clean add, no migration conflicts expected.
2. **Auto-activation**: user has exactly one Group → auto-active, no explicit choice needed. User has zero Groups → `active_group_id` stays null, and surfaces where Group features would appear show a visible create/join-a-group CTA (this CTA is itself part of the fix for "groups are too hidden" — don't just silently omit the feature).
3. **Global switcher**: one component, likely replacing `GroupFilterDropdown.tsx` (currently Artists-tab-only, `src/pages/EditionView/tabs/ArtistsTab/filters/GroupFilterDropdown.tsx`), lives at the edition-view level (header area, visible across tabs) — showing the crew's name is itself what makes Groups discoverable. Lists "Everyone" + every Group the user belongs to. **Picking any entry always persists it as the new Active Group** — there is no separate non-persisting "peek" mode (rejected in grilling, see ADR 0003).
4. **Vote Perspective** (Artists tab): binary toggle, "Everyone ↔ {Active Group name}". Defaults to Active Group when one exists (changed from today's "All Votes" default), else Everyone. Drives `calculateRating`/`getWeightedPopularityScore`/sorting in `useSetFiltering.ts` — same mechanism as today, just default flipped and the group is always the Active Group rather than an arbitrary pick.
5. **Vote Scope** (Schedule tab, new): binary toggle, "Me ↔ {Active Group name}", per the shared filter panel's my-vote-filter chips (Must Go/Interested/Won't Go) from the prior 2026-07-09 timeline-filtering session — check whether that session's chip UI has landed yet; if not, Vote Scope should be designed into it from the start, not bolted on after. Defaults to Active Group when one exists.
6. **Vote Perspective and Vote Scope are independent per tab** — both read the same Active Group, but a user can have Artists on "Everyone" while Schedule is on their Group, or vice versa. Don't share one global me/group boolean across tabs.
7. **Group-scoped chip matching semantics**: a chip (e.g. "Must Go") matches a set under Group scope if **any** member of the Active Group — including the current user — voted that way on it. Not majority, not a threshold. Implement as a plain membership-set check against `set.votes`, mirroring `useSetFiltering.ts`'s existing `groupMemberIds.has(vote.user_id)` pattern.
8. **No data-fetching changes needed.** `useSetsByEditionQuery` (`src/api/sets/useSetsByEdition.ts`) already embeds `votes (vote_type, user_id)` for every user on every set; `useScheduleData.ts:90` already carries that through into `ScheduleSet.votes`. Both Schedule views (`Timeline.tsx`, `ListSchedule.tsx`) already consume sets in this shape. Group-scoping on Schedule is purely a client-side filter over data already being fetched — do not add a new query, and do not reuse `useGroupVotesQuery` (`src/api/voting/useGroupVotes.ts`) for this, since it's per-set and would N+1 across a whole edition.
9. **RLS is not a blocker.** `votes` SELECT policy is `USING (true)` — any authenticated or anonymous read can see all votes. Group-scoping is a client-side display concern, not an access-control one.
10. **URL/search-schema changes**:
    - Add `voteScope: z.enum(["me", "group"]).catch("group")` to both `timelineSearchSchema` and `filterSortSearchSchema` (`src/lib/searchSchemas.ts`) — tab-local state, no group identity in it.
    - Remove `groupId` from `filterSortSearchSchema` and its usage in `GroupFilterDropdown`/`useSetFiltering.ts`; group identity now comes from `profiles.active_group_id`, fetched via a new `useActiveGroupQuery`-style hook, not the URL.
    - Remove the orphaned `votePerspective: z.string().optional()` field from `filterSortSearchSchema` (`src/lib/searchSchemas.ts:23`) and its passthrough in `useUrlState.ts:34` — confirmed dead, nothing reads it. This coincides with deleting `VotePerspectiveSelector.tsx` per the prior session's plan; don't let the two deletions collide, check whether that's already been done.
11. **Vote Perspective naming for Artists tab keeps "Everyone ↔ Group" only** — do not add a "Me" option there; it wasn't asked for and a single-vote "rating" isn't a meaningful aggregate. Vote Scope's "Me" option is Schedule-tab-specific.

## Code map (verified 2026-07-10)

- `profiles` table: `supabase/migrations/20250620065433_create_artists_table.sql:24-28` (+ later `email`, `completed_onboarding` migrations). New migration needed for `active_group_id`.
- `groups` table: `supabase/migrations/20250620152102_create_groups_table.sql:11-18` — confirmed no `edition_id`, global crew, matches the settled model.
- Votes RLS: `supabase/migrations/20250620065433_create_artists_table.sql:73-77`.
- Artists-tab group filtering (pattern to reuse): `src/pages/EditionView/tabs/ArtistsTab/useSetFiltering.ts` lines ~10-16 (member-id fetch) and ~48-55 (filter application).
- Old group dropdown (likely to be replaced by the global switcher): `src/pages/EditionView/tabs/ArtistsTab/filters/GroupFilterDropdown.tsx`.
- User's groups list: `src/api/groups/useUserGroups.ts` (`useUserGroupsQuery`).
- Group membership: `src/api/groups/useGroupMembers.ts` (`useGroupMembersQuery`).
- Sets with embedded votes: `src/api/sets/useSetsByEdition.ts`.
- Schedule transform (already carries votes through): `src/hooks/useScheduleData.ts` line 90, `ScheduleSet.votes` type at lines 31/41.
- Schedule views: `src/pages/EditionView/tabs/ScheduleTab/horizontal/Timeline.tsx`, `.../list/ListSchedule.tsx`.
- Search schemas: `src/lib/searchSchemas.ts` (`filterSortSearchSchema`, `timelineSearchSchema`).
- URL state hooks: `src/hooks/useUrlState.ts`, `src/hooks/useTimelineUrlState.ts`.
- Vote config (unrelated but adjacent): `src/lib/voteConfig.ts`.
- Domain glossary: `CONTEXT.md` (Group, Active Group, Vote Perspective, Vote Scope, Vote). ADR: `docs/adr/0003-active-group-model.md`.

## Open implementation questions (not design forks — resolve while building)

- Where exactly does the global switcher render (which layout component wraps all edition-view tabs)?
- Zero-Group CTA: exact copy/placement — a banner, an empty-state card, or inline in the switcher itself.
- Whether the 2026-07-09 session's shared filter panel (day/time/stage + my-vote chips) has landed yet; Vote Scope needs to slot into it, not be bolted on separately.
- New hook naming, e.g. `useActiveGroupQuery` / `useSetActiveGroupMutation`, following the `use...Query`/`use...Mutation` convention in CLAUDE.md.

## Redactions

None needed — no secrets or PII beyond code structure.

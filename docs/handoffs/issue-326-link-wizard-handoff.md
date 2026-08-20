# Handoff: Issue #326 — Artist Link Wizard (planning complete, not yet implemented)

## Task

Implement GitHub issue [chiptus/UpLine#326](https://github.com/chiptus/UpLine/issues/326). Full scoped spec is in the issue's comment thread (read via `mcp__github__issue_read` method `get_comments`) — the final scope (comment id 5360891741) supersedes earlier comments on that issue. Do not re-derive scope from the issue title alone; read the comments.

Branch: `claude/triage-326-nyce5k` (per repo's git workflow instructions in CLAUDE.md — develop and push there).

## Scope summary (see issue comments for full acceptance criteria)

Standalone step-through wizard, surfaced as a **new "Links" tab on the festival edition admin view** (not a top-level admin tab — user explicitly asked to keep the top-level admin tab bar short). For a selected festival edition:

1. Show a paginated table of that edition's artists missing `spotify_url` and/or `soundcloud_url`.
2. Step through them one at a time (prev/next, not persisted skip state).
3. Plain URL `Input` field(s) for whichever link(s) are missing — no search/autocomplete (explicitly out of scope for this pass; may be a fast-follow).
4. Saving updates only that one field on the artist, no other field changes, no sync triggered (existing `sync-artist-data` / `SoundCloudSyncButton` pipeline is untouched).
5. Artist drops off the remaining list once both fields are filled.

## Key architectural findings (from codebase exploration this session)

- **Artists have no direct edition FK.** The relation is `sets` (has `festival_edition_id`) → `set_artists` (join table) → `artists`. There is no existing "artists for edition" hook; see `useSetsByEditionQuery` in `src/api/sets/useSetsByEdition.ts` for the join pattern to model the new hook on. The new hook must go through `sets`/`set_artists`, dedupe artists by id, then filter to missing links.

- **API module pattern**: `src/api/artists/` — flat files, one hook per file (`useArtists.ts`, `useUpdateArtist.ts`, etc.), shared `types.ts` with `Artist` type + `artistsKeys` query-key factory (`all/lists/list/details/detail`). `useUpdateArtistMutation` (`src/api/artists/useUpdateArtist.ts`) already supports partial single-field updates and can be reused as-is for saving the URL.

- **Pagination pattern — reuse, don't reinvent.** PR [chiptus/UpLine#327](https://github.com/chiptus/UpLine/pull/327) (status: **not yet merged as of last check — verify before starting**) introduces the pagination pattern to adopt:
  - `src/api/artists/useArtistsPage.ts` — Supabase `.select(..., { count: "exact" })` + `.range(from, to)`, `queryOptions` + `keepPreviousData`.
  - `src/lib/searchSchemas.ts` — zod search schema per admin list page (`page`, filters, sort), with `.catch()` defaults.
  - `src/routes/admin/artists.tsx` — `validateSearch` + `stripSearchParams` + `loaderDeps` wiring the URL state to the query.
  - `src/pages/admin/ArtistsManagement/components/BulkEditorPagination.tsx` — the reusable pagination control (shadcn `Pagination` primitives). Check post-merge whether it's still artist-specific or worth extracting to something edition-agnostic before reusing it for the link wizard.
  - **Action for next session**: check if #327 has merged. If yes, branch from current main and reuse these directly. If no, either wait, or inline the same `.range()`/`count: "exact"`/`keepPreviousData` pattern independently (don't block on #327 merging if the user wants to proceed now).

- **Edition admin tab nav**: `src/routes/admin/festivals/$festivalSlug/editions/$editionSlug.tsx` — hardcoded `grid-cols-3` of `Link` components (Stages, Sets, Import), each with an `isOnX` boolean from `location.pathname.includes(...)` and active-tab styling. Adding "Links" means: `grid-cols-3` → `grid-cols-4`, add a 4th `Link` to a new route `src/routes/admin/festivals/$festivalSlug/editions/$editionSlug/links.tsx` (mirror `sets.tsx` structure — loads festival via `festivalBySlugQuery`, edition via `useFestivalEditionBySlugQuery`, wraps content in `Card`).

- **Form/validation pattern for URL fields**: `src/pages/admin/ArtistsManagement/AddArtistDialog.tsx` — zod schema `spotifyUrl`/`soundcloudUrl` as `z.string().url().optional().or(z.literal(""))`, react-hook-form + `zodResolver`, shadcn `Form`/`FormField`/`FormControl`. Reuse the same validation shape for the wizard's URL inputs.

- **Single-field inline update reference**: `src/pages/admin/ArtistsManagement/BulkEditor/UrlCell.tsx` + `BulkEditorTableRow.tsx` — the existing generic `onSave<T extends keyof UpdateArtistUpdates>(field, newValue)` pattern that calls `useUpdateArtistMutation.mutate({ id, updates: { [field]: newValue } })`.

- **No existing page-based wizard component to reuse directly**, but `src/components/Admin/ScheduleImport/ScheduleImportWizard.tsx` is a clean template for step-driven local state (discriminated union `WizardState`, each step a component with callbacks to advance).

## Plan for next session (not yet implemented — no code written yet)

1. Check merge status of PR #327; decide whether to build on it or inline the pagination pattern.
2. New route: `src/routes/admin/festivals/$festivalSlug/editions/$editionSlug/links.tsx`.
3. Add "Links" tab to `$editionSlug.tsx` nav (grid-cols-3 → 4, new `Link` + `isOnLinks`).
4. New paginated API hook, e.g. `src/api/artists/useArtistsMissingLinksPage.ts`, scoped by `editionId`, built via `sets` → `set_artists` → `artists` join, filtered to missing `spotify_url` OR `soundcloud_url`, `.range()`-paginated with `count: "exact"` + `keepPreviousData`.
5. Page component (e.g. `src/pages/admin/festivals/LinkWizard/`): paginated table (row click → jump wizard to that artist) + step-through view (current artist, URL `Input`(s) via react-hook-form + zod, Save → `useUpdateArtistMutation`, Prev/Next). Artist list re-derives from query data after invalidation — no persisted skip state.
6. Follow CLAUDE.md conventions: function declarations not arrow consts, no barrel exports, `mutation.mutate(vars, {onSuccess, onError})` not try/catch mutateAsync, components >150 lines get split, forms use react-hook-form.
7. Before opening/updating a PR, read `.claude/skills/create-pr/SKILL.md` directly and follow it exactly (per CLAUDE.md — do not paraphrase).

## Suggested skills for next session

- `create-pr` — read directly before opening the PR (CLAUDE.md mandates this).
- `run-upline` — build/launch/screenshot the app to manually verify the wizard flow works end-to-end (select edition → paginated table → step through → save → artist drops off list).
- `tdd` — if writing the new query hook test-first is preferred; at minimum add a unit test for the missing-links filtering/join logic.
- `code-review` — after implementation, review the diff against CLAUDE.md standards and the issue's acceptance criteria before creating the PR.

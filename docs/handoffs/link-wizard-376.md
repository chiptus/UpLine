# Handoff: Link Wizard Enhancements (Issue #376)

## Focus for next session

Run the `prototype` skill to settle the one open structural question (Q13 below: desktop layout with artist list moved to the left side), then continue/finish the `grilling` design session and move into `domain-modeling` if needed. This is a **continuation of an in-progress `/grill-with-docs 376` session** — the grilling interview is functionally done (all decisions settled except the prototype), do not restart it from scratch.

## Source

- GitHub issue: https://github.com/chiptus/UpLine/issues/376 ("Link Wizard enhancements", label `priority:high`)
- Repo: `chiptus/UpLine`, working dir `/home/user/UpLine`
- Target branch: `claude/link-wizard-enhancements-uhez0n`

## Issue scope (verbatim asks)

- Paste a provider link → search and bring metadata
- Validate custom links
- Rename "search again" → "custom search", default to artist name
- Maybe move artist list to the left side on desktop
- Filter by stage
- Locally persist skipped/saved artists across refresh, with view/clear option
- Handle Spotify 429 rate limits

## Codebase findings (already gathered — don't re-explore)

Link Wizard lives under `src/pages/admin/festivals/LinkWizard/`:

- `LinkWizard.tsx` — orchestrator (fetches artists missing links, current artist, pagination)
- `LinkWizardStep.tsx` — per-artist form (Spotify + SoundCloud URL fields via `optionalUrlSchema` Zod check — currently just `.url()`, no provider-shape validation)
- `LinkWizardTable.tsx` — "Remaining Artists" table below the step card (not mobile-adapted)
- `ProviderCandidatesPanel.tsx` — per-provider candidates + "Search Again" toggle (lines ~54-64) that just reveals a custom search input, doesn't itself re-search
- `useProviderCandidates.ts` — custom search query logic
- `CandidateCards.tsx` / `CandidateCard.tsx` — grid `grid-cols-1 md:grid-cols-3`
- `StagedFieldsPreview.tsx` — staged URL/image/description inputs (lines ~42-65 for URL fields)
- `useArtistBatchQuery.ts` — batches initial provider search for all missing-link artists
- Route: `src/routes/admin/festivals/$festivalSlug/editions/$editionSlug/links.tsx`

Providers: only Spotify + SoundCloud (`Provider = "spotify" | "soundcloud"` in `src/api/artistSearch/types.ts`). Search goes through Supabase edge function `search-artist-links` (`supabase/functions/search-artist-links/index.ts`) → `spotify-adapter.ts` / `soundcloud-adapter.ts`. Spotify auth: client-credentials with in-memory token cache (`supabase/functions/_shared/spotify-api/auth.ts:9-27`). No retry/backoff or 429-specific handling anywhere in the Spotify path today (SoundCloud auth does special-case 429 but only for a friendlier error, no retry).

Reusable patterns found:

- Stage filter: `src/pages/EditionView/tabs/ScheduleTab/StageFilterButtons.tsx` — multi-select toggle-button group.
- Mobile filter sheet: `ScheduleFilterSheet.tsx` (same tab dir).
- localStorage hook template: `src/hooks/useCookieConsent.ts:25-58` (versioned JSON blob, try/catch parse, setters syncing state + storage).

Data model: `artists` table has `spotify_url` / `soundcloud_url` columns directly (no join table). Relevant type: `src/integrations/supabase/types.ts:153-170`.

## Decisions locked in during grilling (do not re-ask)

1. **Paste-to-fetch is button-triggered, not automatic on paste.** No auto-fetch-on-paste behavior.
2. **Fetch-by-URL applies only to the manual URL input fields** (`StagedFieldsPreview.tsx`), not the custom-search box.
3. **Custom link validation**: enforce provider-specific URL shape (e.g. `open.spotify.com/artist/...`, `soundcloud.com/...`), reject other domains/paths, inline error message.
4. **"Search again" → "Custom search"**: literal rename + default the input to the current artist's name.
5. **"Fetch from URL" button**: one per provider URL field in `StagedFieldsPreview.tsx`, disabled until the field passes the shape validation from decision 3. On click, does an ID-based lookup (not name search) and stages image/description/etc. exactly like picking a candidate card does today.
6. **Fetch failure/404 handling**: inline error near the button/field (e.g. "Artist not found"), no silent fallback to a name search.
7. **Stage filter**: multi-select, mirrors `StageFilterButtons.tsx` pattern exactly, filters the "Remaining Artists" queue. Desktop: inline toggle buttons in the wizard header. Mobile: collapses into a filter sheet like `ScheduleFilterSheet.tsx`.
8. **Skipped/saved local persistence**: key by (edition ID, artist ID) in localStorage. Skipped and saved-this-session artists are excluded from the default wizard queue on reload. Provide a lightweight popover/dropdown in the wizard header (not a separate route) listing skipped+saved artists, with per-item "restore to queue" and a "clear all" action.
9. **Spotify 429 handling**: retry once or twice with backoff honoring the `Retry-After` header (per Spotify's rate-limit docs: https://developer.spotify.com/documentation/web-api/concepts/rate-limits) inside the edge function; if still failing, surface a clear user-facing "rate limited, try again in Ns" message instead of a generic error.

## Still open (why this handoff exists)

**Q13 — Desktop layout: artist list on the left.** The issue said "maybe move artist list to be (in desktop) on the left side." Agreed this is a real structural change (current desktop layout: step card on top, "Remaining Artists" table below) and should be prototyped rather than decided blind. User agreed to run the `prototype` skill now, in-session, before finalizing. **This did not happen yet before the handoff was triggered.**

## Suggested skills for next session

1. **`prototype`** — build a throwaway prototype of the desktop Link Wizard layout with the artist list moved to the left side, to sanity-check whether it reads better than the current top/bottom stacking. This is the immediate next action.
2. **`grilling`** — resume/close out the design-tree interview once the prototype settles the layout question (confirm the final layout decision with the user; frontier should then be empty).
3. **`domain-modeling`** — the original `/grill-with-docs 376` invocation calls for this after grilling; use it to capture/update any domain vocabulary or ADR-worthy decisions from this feature (e.g. if "skipped/saved" becomes a named concept, or if provider-URL validation rules deserve a documented convention) in `CONTEXT.md` / `docs/adr/`.
4. **`create-pr`** — once implementation is complete, follow this skill exactly for PR title/description/verification format (per repo's CLAUDE.md instruction).

## Not yet started

No implementation code has been written. This session was pure requirements-gathering (grilling interview only); domain-modeling has not been invoked yet either.

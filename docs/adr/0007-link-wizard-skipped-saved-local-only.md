# Link Wizard skipped/saved state is browser-local, not server-side

Issue #376 asked to "keep (locally) the skipped or saved artists, so next time I refresh, I see only those I didn't do." We store this as a `localStorage` record keyed by (edition ID, artist ID), following the existing `useCookieConsent`-style versioned-JSON-blob pattern, rather than a new `link_wizard_progress` table or column on `artists`.

The issue explicitly scoped this to "locally," and the workflow it serves — one Core Team member powering through a queue in one sitting, not wanting to redo artists they've already handled or intentionally deferred — doesn't need to survive a device change or be visible to teammates. A server-side table would imply per-team-member sync and conflict handling ("what if two admins are both linking artists right now") that nothing in the issue asked for and that adds a migration for a workflow convenience, not a shared piece of festival data.

## Considered Options

- **`localStorage`, keyed by (edition, artist) (chosen).** Zero backend changes, matches the issue's explicit "locally" scoping, and reuses an established hook pattern in this codebase.
- **New table (e.g. `link_wizard_progress`) synced via Supabase.** Rejected: turns a one-person, one-sitting convenience into shared state with no clear ownership or conflict story, for a request that never asked for cross-device or cross-teammate visibility.

## Consequences

- Skipped/saved state does not survive clearing browser data, and is invisible to a second Core Team member linking the same edition — if that turns out to matter in practice, revisit as a server-side table.
- The Link Wizard header exposes a popover to view and restore skipped/saved artists (decision 8 in `docs/handoffs/link-wizard-376.md`) since there's no admin page to manage this state otherwise.

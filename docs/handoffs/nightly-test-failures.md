# Handoff: Fix nightly test failures on main

## Focus for next session

Main's Nightly Tests workflow is red. Three independent failures — one component
accessibility bug and two broken tests — plus a broken failure-notification
script. All are root-caused below with concrete fixes; no further investigation
is needed. Implement the fixes on this branch and open a PR to `main`.

## Source

- First failing run: https://github.com/chiptus/UpLine/actions/runs/33177062666
  (main head `dc85c51`, 2026-08-28)
- All three were introduced by the merges of #438, #441 and #442 on 2026-08-28
  and were never caught earlier: integration tests and the mobile Playwright
  projects only run in nightly and labeled full-suite runs, not on ordinary PR
  pushes or the desktop smoke run.
- PR #443 hits the same three failures in its labeled full-suite run because
  that run executes the PR's merge ref with main. Nothing in #443 touches these
  paths — do not look for causes there.

## Failure 1 — e2e `set-type-filter.spec.ts` (Mobile Chrome + Mobile Safari)

**Symptom:** `getByRole("button", { name: /Filters/ })` times out at
`tests/e2e/set-type-filter.spec.ts:16`. Desktop projects pass.

**Root cause:** `src/components/filters/FilterToggle.tsx` renders the label as
`<span className="hidden md:inline">{label}</span>`. On mobile viewports the
text is `display:none`, so the button's accessible name no longer contains
"Filters" — the lucide `Filter` icon contributes no name.

**Fix (component):**

- Add `aria-label={label}` to the toggle `Button` so the accessible name is
  viewport-independent. `aria-label` replaces the content-derived name with
  exactly "Filters", so the spec's `name: /Filters/` still matches on desktop,
  and the descendant assertion
  `getByRole("button", { name: /Filters/ }).getByText("1")` still works.
- The sibling Clear button has the same latent bug and is worse: its "Clear"
  text is `hidden sm:inline`, leaving it with an **empty** accessible name on
  mobile. Add `aria-label="Clear filters"` to it too.

`FilterToggle` is only used by
`src/pages/EditionView/tabs/VoteTab/filters/FilterSortControls.tsx` with the
default label. The other "Filters" buttons (ScheduleFilterSheet,
LineupFilters, LinkWizardFilterSheet) render their labels differently and
their specs pass — leave them alone.

## Failure 2 — e2e `set-form-type.spec.ts` › "creates a workshop with no artists via the form" (Mobile Chrome)

**Symptom:** strict mode violation at `tests/e2e/set-form-type.spec.ts:31` —
`getByText("Breathwork Circle")` resolves to 2 elements (3 on retry).

**Root cause:** the test creates a set with the fixed name "Breathwork Circle"
in the shared local Supabase DB. Every browser project runs the same test
against the same DB, and every retry adds another row, so the admin sets table
shows multiple identical rows and the non-`.first()` locator fails strict mode.

**Fix (test only):** use a unique set name per run and assert on it, e.g.

```ts
const setName = `Breathwork Circle ${Date.now()}`;
```

used for both the form fill and the final visibility assertion. (Just adding
`.first()` would also pass, but the unique name additionally stops the test
polluting the shared edition with identical rows across projects/retries —
`set-type-filter.spec.ts`'s header comment already documents that concern.)

## Failure 3 — integration `LinkWizardStep.integration.test.tsx` › "stages the fetched candidate for the user to select fields from"

**Symptom:**
`TestingLibraryElementError: Unable to find an element with the display value: https://example.com/image.jpg`
at the `waitFor` after clicking "Select all".

**Root cause:** the assertion is impossible, not flaky. After "Select all",
`handleCandidateSelect` in `LinkWizardStep.tsx` calls
`form.setValue("image_url", ...)`, and `StagedFieldsPreview.tsx` renders that
value as `<img src={imageUrl} alt="" />`. No input or textarea ever holds the
image URL, so `getByDisplayValue` (which only matches form-control values) can
never find it. The test merged with #441 and integration tests don't run on
ordinary PR pushes, so it has never passed in CI.

**Fix (component + test):**

- In `StagedFieldsPreview.tsx`, give the staged image a meaningful alt, e.g.
  `alt="Staged artist image"`. (Also an a11y improvement — `alt=""` marks a
  meaningful content image as decorative.)
- In the test, replace both display-value assertions with role-based ones:
  - Before "Select all" (staging must not apply anything):
    `expect(screen.queryByRole("img", { name: "Staged artist image" })).not.toBeInTheDocument();`
    — no clash with the fetched `CandidateCard`'s own image, whose alt is the
    candidate name ("Fetched Artist").
  - After "Select all":
    `await waitFor(() => expect(screen.getByRole("img", { name: "Staged artist image" })).toHaveAttribute("src", "https://example.com/image.jpg"));`
- While in the file: move the
  `vi.mock("@/api/artistSearch/useFetchArtistByUrlMutation", ...)` call out of
  the test body to the top level next to the existing
  `useSearchArtistLinksQuery` mock. Vitest hoists it there anyway and the CI
  log warns this will become an error in a future version.

## Bonus — nightly failure notifications never fire

The same run's `notify-failure` job crashes before notifying:
`.github/scripts/notify-nightly-failure.js` uses CommonJS (`module`) but
`package.json` has `"type": "module"`. Rename it to `.cjs` (or convert to ESM)
and update the workflow reference. Until this is fixed, nightly failures are
silent.

## Done means

- The three tests pass in a full-suite run: integration job green, and
  `set-type-filter.spec.ts` / `set-form-type.spec.ts` green on **all**
  Playwright projects including Mobile Chrome and Mobile Safari.
- `pnpm test` (unit) and the desktop smoke tests stay green.
- Main's next Nightly Tests run is green, and a forced nightly failure would
  actually notify (script loads without the ES-module crash).

## Verification constraints from the diagnosing session

- The remote session that wrote this handoff had no Docker (no local Supabase)
  and only anon-key staging credentials, so none of the failing tests were
  re-run — the diagnoses are from CI logs plus reading the components. All
  three causes are deterministic (missing accessible name, duplicate rows,
  impossible query), but run the integration file and the two specs locally
  before opening the PR.

# Handoff: Link Wizard layout decision (Issue #376, Q13)

## Decision

**Q13 is settled: variant B — left rail.** The user picked variant B from the
layout prototypes: a narrow (280px) sticky left sidebar showing the entire
queue as one compact scrollable list (no pagination), with green/orange dots
marking missing Spotify/SoundCloud links, and the step card keeping the rest
of the width. Below the `lg` breakpoint the layout collapses to a single
column with the queue dropping below the step card.

With this, **all questions from the grilling interview are settled** — see
`docs/handoffs/link-wizard-376.md` for decisions 1–9. The grilling frontier is
empty; do not reopen it.

## Already implemented

The winning layout is folded into the codebase on branch
`claude/link-wizard-handoff-nfvt3v` (PR #404, which targets this branch):

- `src/pages/admin/festivals/LinkWizard/LinkWizard.tsx` renders the left-rail
  grid; queue extracted to `LinkWizardQueue.tsx`.
- Both throwaway prototypes (`LinkWizardLayoutPrototypes.tsx` +
  `PrototypeSwitcher.tsx` from PR #404, `LinkWizard.prototype-layout.tsx` from
  this branch) are deleted, along with the now-unused `LinkWizardTable.tsx`
  and the `?variant=` search param on the links route.
- The full variant set is preserved on throwaway branch
  `prototype/link-wizard-layouts-376`.

Note for decision 7 (stage filter): it filters the queue, which is now the
left-rail list, not a table. Decision 8's header popover lives in the step
card header or above the rail.

## Next steps

1. `domain-modeling` — capture ADR-worthy conventions from decisions 1–9
   (provider-URL shapes, skipped/saved concept) in `CONTEXT.md` / `docs/adr/`.
2. Implement decisions 1–9 from the main handoff doc.
3. `create-pr` per the repo skill once implementation lands.

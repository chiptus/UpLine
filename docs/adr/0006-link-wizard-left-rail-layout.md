# Link Wizard queue lives in a sticky left rail, not a table below the step card

Issue #376 flagged the desktop Link Wizard layout as a "maybe" — the artist queue sat in a paginated table below the step card, pushed off-screen as soon as a Core Team member scrolled into a step's provider candidates. Rather than guess, we prototyped three structurally different layouts (stacked/current, a left sidebar with the full paginated table, and a compact left rail) on the real route behind a `?variant=` switch and picked live: variant B, a sticky 280px left rail listing the whole queue as one scrollable list (no pagination) with dots marking which provider links are missing, step card taking the rest of the width.

The paginated table (`LinkWizardTable`) is deleted, not kept as an alternate view — pagination existed to make a full-width table below the fold usable, and that constraint no longer applies once the queue is a narrow sticky rail.

## Considered Options

- **Left rail, full list, no pagination (chosen).** The whole queue is visible while working through steps; a Core Team member can jump to any artist without leaving the step card in view.
- **Left sidebar with the paginated table.** Rejected: a table's columns don't fit a narrow sidebar, and keeping pagination there just relocates the original off-screen problem.
- **Keep the stacked layout.** Rejected: the queue disappears below the fold while working a step, which was the original complaint driving this issue.

## Consequences

- Below the `lg` breakpoint the layout collapses to one column with the queue below the step card, same as before — the rail is a desktop-only affordance.
- The full three-variant prototype (including the two rejected layouts) is preserved on throwaway branch `prototype/link-wizard-layouts-376` per the `prototype` skill, not on `main`.

# PROTOTYPE — Festival v2 identity on the real edition views

**Question:** Does the identity decided in #320 (Festival v2 dark — violet poster
ground, Unbounded display, lime accent — plus the soft-border light mode) hold up
against the real edition views, with real data and chrome?

**How to run:** `pnpm run dev`, open any edition view, use the floating
PROTOTYPE bar at the top (or ←/→ keys) to cycle
`current` → `festival-dark` → `festival-light` → `hybrid-dark` (comparison
only — the #320 decision is Festival v2). Shareable via `?identity=`.
The switcher is deliberately NOT production-gated: this branch exists to be
shown to non-technical reviewers via the Vercel PR preview and is never
merged as-is.

**What this is NOT:** the implementation. It brute-forces overrides of today's
hardcoded palette classes with scoped CSS. The real rollout is specced in #321
using the token vocabulary from `docs/design/edition-color-vocabulary.md`.

**Verdict:** _(fill in after review, then delete this directory, the switcher
wiring in `src/routes/festivals/$festivalSlug/editions/$editionSlug.tsx`, and
capture the answer in #321)_

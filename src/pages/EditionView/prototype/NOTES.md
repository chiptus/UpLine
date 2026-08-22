# PROTOTYPE — Festival v2 identity on the real edition views

**Question:** Does the identity decided in #320 (Festival v2 dark — violet poster
ground, Unbounded display, lime accent — plus the soft-border light mode) hold up
against the real edition views, with real data and chrome?

**How to run:** `pnpm run dev`, open any edition view, use the floating
PROTOTYPE bar at the top (or ←/→ keys) to cycle
`current` → `festival-dark` → `festival-light` → `hybrid-dark` (comparison
only — the #320 decision is Festival v2). Shareable via `?identity=`. On
production/preview builds the switcher stays hidden unless the URL carries
`?proto=1` or an `?identity=` value (so it works on Vercel PR previews).

**What this is NOT:** the implementation. It brute-forces overrides of today's
hardcoded palette classes with scoped CSS. The real rollout is specced in #321
using the token vocabulary from `docs/design/edition-color-vocabulary.md`.

**Verdict:** _(fill in after review, then delete this directory, the switcher
wiring in `src/routes/festivals/$festivalSlug/editions/$editionSlug.tsx`, and
capture the answer in #321)_

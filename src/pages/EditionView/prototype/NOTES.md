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

**Verdict (2026-08-22):** Festival v2 holds up on real screens and is
confirmed for both modes: `festival-dark` (violet ground, lime accent,
Unbounded) and `festival-light` (olive-green #4c7a00 accent, soft borders on
#fafaf7). One skeleton, two color themes — typography does NOT change between
modes. The hybrid variants (coral, Bricolage/Public Sans) and the
`unified-light` comparison were reviewed and rejected; this also settles
#320's open light-accent question in favor of green. Border radius was
softened from the mockups' 18/14px to 12/10px and stays an open knob for
#321 (single `--radius` token). Next: spec in #321, then delete this
directory and its wiring in
`src/routes/festivals/$festivalSlug/editions/$editionSlug.tsx`.

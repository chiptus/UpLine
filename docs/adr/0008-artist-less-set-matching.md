# Artist-less sets match strictly; roster sets match fuzzily

Schedule-import matching (issue #433) needed an identity for sets with no
artists, where the roster key doesn't exist. We decided identity differs by
kind: roster rows are identified by their sorted artist slugs, with stage/date
as mere tie-breakers (a set whose day moved is an update); artist-less rows are
identified by name only, so every supplied discriminator must actually hold —
a stored stage or date that contradicts the row excludes the candidate, and no
survivor means a create. The alternative (one fuzzy rule for both) silently
updated the wrong set whenever a name like "Fire Show" recurred across days.

Settled in design review (2026-08-28) alongside three boundary decisions: a
roster _change_ is a new identity (a solo set gaining a B2B partner creates a
new set and orphans the old one — votes do not carry over); renaming an
artist-less set must happen in the app, since a CSV rename reads as
create-new + orphan-old; and the artist-less/roster boundary is hard in both
directions (crediting a performer to a formerly artist-less set, or removing
the last artist, changes identity). The orphan review step is the safety net
for all three.

## Consequences

- The two index spaces never cross: a roster row cannot match a 0-artist set,
  nor the reverse — adding an artist to a set changes its import identity.
- Candidates with no stored time/stage still match, so time-less rows survive
  re-import without duplicating; the cost is that such sets can't coexist with
  a dated same-name set unambiguously.
- A fuzzy-matched CSV stage provisionally stands in for its closest DB stage
  during matching, before the user resolves the mismatch — wrong-set selection
  is possible if they map it elsewhere (#447, with an ignored marker test in
  `computeDiff.artistless.test.ts`).

# Retrospective rating is a separate axis from Vote

Post-Festival (see ADR-0003), users switch from planning to remembering: they want to react to how a set actually was, not to re-decide whether they'd go. **Vote** is anticipatory — it answers "will I go" while planning is still live and drives points ("Must Go" +2, "Interested" +1, "Won't Go" -1). A retrospective reaction answers a different question, "did I like it," after the fact, so it is stored as its own **rating** on `set_ratings` (added in #139) rather than overwriting or reusing `votes`.

A user's Vote and rating on the same set are independent: rating a set never touches `votes`, and voting never touches `set_ratings`. A user can rate a set "loved it" that they voted "Won't Go" on (they went anyway and were won over) or never voted on at all (someone else's group brought them). Collapsing the two into one field would either destroy the planning record once the festival ends, or force awkward reinterpretation of a "Won't Go" vote as a bad review.

The rating scale is deliberately distinct from Vote's, both in values and in copy/iconography — "loved it / liked it / meh," never "Must Go / Interested / Won't Go." Reusing Vote's scale or labels would imply the two are the same measurement wearing different phase-appropriate clothing, when the domain intent (plan vs. remember) is different in kind.

## Considered Options

- **Separate `set_ratings` table + rating scale (chosen).** Preserves the Vote record untouched forever, models "did I like it" as its own concept, and keeps the two data-access modules (`src/api/voting`, `src/api/ratings`) symmetric and independently testable.
- **Repurpose `votes` after Post-Festival, reinterpreting vote_type as a rating.** Rejected: destroys the pre-festival planning record (what the user intended to see) the moment the festival ends, and conflates two different questions under one column.
- **Add a `rating` column to `votes` alongside `vote_type`.** Rejected: couples two independent write paths to one row/table, so a rating write and a vote write race on the same row instead of being isolated axes; also complicates the optimistic-update cache since it's no longer a single scalar per set.

## Consequences

- `src/api/ratings/useRateSet.ts` mirrors `src/api/voting/useVote.ts`'s optimistic upsert/delete-on-toggle pattern almost exactly, upserting on `(user_id, set_id)`, and `src/api/ratings/useUserRatings.ts` mirrors `useUserVotes.ts` — the two modules can be read side by side.
- The primary tab's set-card action swaps between `SetVotingButtons` and `SetRatingButtons` (via `SetActionButtons`) purely on `useFestivalPhase() === "post-festival"`; the underlying set list, cards, and set-detail links are unchanged.
- Any future "why didn't my rating change my vote" question resolves by pointing at this ADR: it's by design, not a bug.

# One vote Score, replacing rating and popularity

Three vote-aggregation formulas coexisted, each hand-rolled from `vote_type`
literals in a different file: **rating** (mean of vote values, drove the
`rating-desc` sort and the Minimum Rating filter), **popularity**
(`2·mustGo + interested`, no Won't-Go term, drove the default
`popularity-desc` sort), and a **net score** (`2·mustGo + interested − wontGo`,
the Set-detail "Score" badge). All three bypassed `voteConfig`'s canonical
weights. The popularity/net split was documented in the sort-help popover, so
it was intentional — but it meant a set could rank above another it visibly
"scores" below, and none of the aggregation logic was tested.

We consolidated on a single metric: **Score = the sum of a set's vote values**
(`2·mustGo + interested − wontGo`, weights read from the vote config). It is
computed in one pure module, `src/lib/votes/score.ts` (`tallyVotes(votes) →
{ counts, score }`), which also owns per-type counting. One sort ("Top Score",
`score-desc`, the default) replaces both vote sorts; the Minimum Rating filter
is removed; the badge is unchanged but now provably shows the same number the
sort ranks by. `voteConfig` moved to `src/lib/votes/config.ts` alongside it.

## Considered Options

- **Single net Score (chosen).** UpLine's core loop is group consensus, and
  Won't-Go is the consensus signal — a sort that ignores it hides exactly the
  disagreement a group needs to see. One number users can verify by counting
  the per-type counts displayed beside it. Sum over mean because every set is
  scored by the same small pool (a group), so normalization buys little, and
  "more people caring moves it up" matches intuition.
- **Keep rating + popularity as documented, deliberately distinct metrics.**
  Defensible (popularity as an "enthusiasm/buzz" measure that tolerates
  controversy), but it permanently costs explaining why the #1-ranked set can
  show a lower score than #3. With no usage data indicating anyone relies on
  the distinction, legibility won.
- **Mean rating as the single metric.** Normalized, but favours
  few-but-enthusiastic votes over broad support, and its own filter UI proved
  how illegible it was: the "Minimum Rating 3+" option was unreachable (max
  possible mean is 2).

## Consequences

- Ranking visibly changes: sets with many Won't-Go votes drop relative to the
  old default popularity sort. One-time reshuffle toward the number already
  shown on the detail page.
- Old bookmarked URLs with `sort=rating-desc`/`popularity-desc` or `minRating`
  degrade gracefully: the zod `.catch` falls back to `score-desc` and unknown
  params are dropped.
- If a "buzz"-style enthusiasm metric is ever wanted (e.g. for an explore
  surface), add it as a new named concept in `tallyVotes` and `CONTEXT.md` —
  do not re-derive from `vote_type` literals in components, and do not reuse
  the names "rating" or "popularity" (retired, see CONTEXT.md).
- `useVoteCount` was deleted; all per-type counts come from
  `tallyVotes().counts`.

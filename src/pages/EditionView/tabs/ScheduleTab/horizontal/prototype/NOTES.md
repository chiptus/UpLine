# PROTOTYPE — timeline navigation, filtering & my-vote chips

**Throwaway code.** Three variants of timeline navigation + my-vote filtering,
switchable via `?variant=`, on the existing
`/festivals/$festivalSlug/editions/$editionSlug/schedule/timeline` route.
Delete this folder (plus `src/components/prototype/` and the two
PROTOTYPE-marked blocks in `src/lib/searchSchemas.ts` and
`../Timeline.tsx`) once the verdicts below are captured.

## How to run

```
pnpm run dev
```

Open any edition's timeline with a variant param, e.g.:

```
/festivals/<festival>/editions/<edition>/schedule/timeline?variant=a
```

Flip variants with the floating bottom bar or the ←/→ keys. Without
`?variant=`, the production timeline renders untouched (switcher included —
it only mounts when a variant is active in the URL), so preview deploys can
be shared safely.

Demo affordances (prototype-only, the real implementation drops both):

- "Now" is **faked** to ~60% into the edition window (still ticks every 60s)
  so the Now button + current-time indicator are always demoable.
- Logged out, "my votes" are **fake** (deterministic per set); logged in, your
  real votes are used. The real implementation hides the chips when logged out.

## The variants

| | Navigation | Scroll on jump | My-vote chips | Now indicator |
|---|---|---|---|---|
| **a — Slim jump bar** | sticky ghost day buttons + Now pill (agreed design, literal) | smooth | inside collapsed filter panel | thin fuchsia line + dot |
| **b — Segmented rail** | segmented control highlighting the day at viewport center | instant | inline row above strip, with counts | gradient line + "now HH:mm" bubble |
| **c — Mini-map** | proportional overview strip, draggable viewport window, click to jump | smooth | compact icon chips in map header | dashed white line |

All variants share the agreed `scrollTo` URL mechanics (`useScrollToUrl.ts`):
debounced ~300ms scroll-idle write, 5-minute rounding, history replace,
one-way ownership, mount precedence `scrollTo` → day filter → now−1h →
festival start. Back-from-a-set-page restores position in every variant.

## Questions to answer (fill in verdicts, then delete the folder)

1. **Does URL-driven jumping feel right?** Smooth (a, c) vs instant (b) on
   day/Now clicks; jank while swiping from the debounced `scrollTo` writes;
   does back-restoration land where you expect?
   - VERDICT:
2. **Does the nav-vs-filter split read?** Do test users reach for the jump bar
   to move and the Filters panel to narrow, or do they tap "Fri" expecting a
   filter? (b's active-day highlight may make it read *more* like a filter —
   that's deliberate, to probe the confusion.)
   - VERDICT:
3. **Vote-chip placement and form.** In-panel (a) vs inline with counts (b) vs
   compact-in-minimap (c)? Does "my schedule" (Must Go + Interested) feel like
   a two-tap primary use case?
   - VERDICT:
4. **Current-time indicator + jump bar visual treatment.** Which of the three
   treatments has enough contrast without shouting?
   - VERDICT:

Open sub-question surfaced while building: when the day *filter* is active,
the jump bar only shows the filtered day's button (nav operates on what's
rendered). Right call, or should all days stay and clear the filter on jump?
   - VERDICT:

## After verdicts

Fold amendments into the drafted PRD, publish it to GitHub Issues with
`ready-for-agent`, and delete the prototype code (see the deletion list at
the top).

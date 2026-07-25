# PROTOTYPE — Schedule chrome density

**Question:** now that filters and timeline navigation exist, the Schedule
view feels packed on mobile — five stacked boxes (phase banner, view
switcher, timezone bar, filters card / toolbar) before any content. How
should the chrome consolidate?

**Iteration 1** explored density (quiet chrome / command bar / content
first). Feedback: content-first direction preferred; timezone bar dropped
for good (it flagged a fixed bug — times are festival-time everywhere).

**Iteration 2** tried a dropdown view switcher (bar space) and made the
timeline's date band + hour scale a sticky strip (synced via `translateX`)
docking below the toolbar. Feedback: dropdown hides the views (worst on
desktop); the bar changing shape per view (menu-only on Now, big toolbar
on Timeline, filters on List) breaks the anchor.

**Iteration 3** (this one): all variants share the content-first base
(identity row instead of hero, no boxed banner, no timezone bar, unboxed
timeline, sticky headers); the axis is now the **navigation mechanism**,
each consistent across Now/Timeline/List:

- **current** — baseline, unchanged.
- **tabs** — slim underline text tabs (Now · Timeline · List) at the same
  spot on every view; per-view controls sit below.
- **unibar** — one sticky bar with fixed slots on all three views: 3-icon
  strip always left, view-specific tools fill the rest (Now gets the same
  bar).
- **thumbbar** — segmented switcher docks above the bottom tab bar on
  mobile (thumb-reachable); normal top segmented row on desktop.
- **autohide** (iteration 4) — the current-style segmented switcher stays
  at the top, and the mobile Vote/Schedule/Explore bottom bar slides away
  while scrolling down (back on scroll up or near the top) so content gets
  the whole screen. Iteration 5: its list view has no filters row at all —
  the filter trigger lives inside the sticky day header.

**Iteration 5** (feedback: 5 looks good; list filters need a home; day
header sticky was buggy): the list is now grouped per day on all
non-current variants, so the sticky day header's range spans the whole day
(it previously sat inside the day's first time slot and un-stuck after
~one screen). On `autohide` the day header also hosts the Filters trigger.

**Iteration 6** (feedback: keep only variant 5): pruned to `current` +
`autohide`; deleted the tabs/unibar/thumbbar components. Decisions pulled
in from the mobile session: auto-hide applies everywhere; Tickets/Website
buttons are dropped for now (follow-up ticket: move them to the info tab);
non-live phases get a compact status in the identity row's Live-dot slot —
pre-schedule → "Schedule soon", planning → "N days to go" ("Schedule out"
at/past start), live → pulsing dot + "Live", post-festival → nothing.

**Iteration 7**: the pill now compares three treatments of the identity
row's phase-status line (chrome identical otherwise): `autohide-countdown`
(baseline — "Schedule soon" / "N days to go", dot only when live),
`autohide-dates` (color-coded dot in every phase: slate "Schedule soon" /
amber "Jul 1–3" / red "Live"), `autohide-cta` (dates+dot, but pre-schedule
says "Vote now" to keep the old banner's voting CTA).

**Iteration 8**: added `collapse` — the current-style hero (title, logo,
Tickets/Website, full-sentence phase copy as a quiet subtitle) shows at
rest; once it scrolls out of view, a compact identity (logo + name +
status dot, dates treatment) takes over the top bar's center slot. Gives
back the brand moment and the lost Tickets/Website buttons at zero
scrolled-state cost; the rest of the chrome matches the autohide variants.

**Open axis — color:** the palette (blue-grey gradient + purple glass +
amber accents) is a separate exploration. Most colors are hardcoded
Tailwind utility classes (`purple-200`, `bg-white/10`, …), not theme
tokens, so a re-skin needs a tokenization pass first — do it after the
structural verdict, not inside this prototype.

**Verdict:** _pending — fill in the winning variant (or mix) before
deleting this folder._

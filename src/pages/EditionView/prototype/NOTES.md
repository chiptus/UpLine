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

**Open axis — color:** the palette (blue-grey gradient + purple glass +
amber accents) is a separate exploration. Most colors are hardcoded
Tailwind utility classes (`purple-200`, `bg-white/10`, …), not theme
tokens, so a re-skin needs a tokenization pass first — do it after the
structural verdict, not inside this prototype.

**Verdict:** _pending — fill in the winning variant (or mix) before
deleting this folder._

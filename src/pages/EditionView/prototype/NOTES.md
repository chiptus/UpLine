# PROTOTYPE — Schedule chrome density

**Question:** now that filters and timeline navigation exist, the Schedule
view feels packed on mobile — five stacked boxes (phase banner, view
switcher, timezone bar, filters card / toolbar) before any content. How
should the chrome consolidate?

Flip variants with the floating pill (or `?variant=`), on any schedule view:

- **current** — baseline, unchanged.
- **quiet** — information stops being boxes: phase message becomes a subtitle
  line under the title (pulsing dot when live), timezone bar removed
  (times are festival-time everywhere — the bar flagged a fixed bug),
  list filter card becomes a slim right-aligned row, timeline loses its
  framing box, sticky bars clear the fixed top bar.
- **commandbar** — everything in _quiet_, plus the Now/Timeline/List
  switcher collapses to icons inside the sticky toolbar (and a matching
  sticky bar on the list view): exactly one control strip above content.
- **compact** — everything in _commandbar_, plus the hero title block is
  replaced by a slim logo + name + live-dot row: content-first.

**Iteration 2** (feedback: leaning compact, but the icon strip eats bar
space; want the timeline date/time header sticky):

- `compact` now uses a slim dropdown view switcher (icon + chevron) in the
  bar; `commandbar` keeps the 3-icon strip so both widths can be compared.
- All non-current variants: the timeline's date band + hour scale is
  lifted out of the horizontal scroller into a sticky strip (synced via
  `translateX`) that docks below the toolbar while scrolling.

**Open axis — color:** the palette (blue-grey gradient + purple glass +
amber accents) is a separate exploration. Most colors are hardcoded
Tailwind utility classes (`purple-200`, `bg-white/10`, …), not theme
tokens, so a re-skin needs a tokenization pass first — do it after the
structural verdict, not inside this prototype.

**Verdict:** _pending — fill in the winning variant (or mix) before
deleting this folder._

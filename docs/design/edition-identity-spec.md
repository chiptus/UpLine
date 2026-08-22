# Edition visual identity spec — Festival v2

Resolution of [#321](https://github.com/chiptus/UpLine/issues/321), part of the visual-identity wayfinder map [#317](https://github.com/chiptus/UpLine/issues/317). Written in the semantic token vocabulary from [`edition-color-vocabulary.md`](./edition-color-vocabulary.md); implementation tickets are cut from this document.

**Scope:** the voter-facing edition views only (EditionView hero/tabs, schedule Now/Timeline/List, artists, explore, set details). Admin, groups/settings, and landing/auth keep the old skin.

**Provenance:** direction decided in [#320](https://github.com/chiptus/UpLine/issues/320) (Festival v2 winner, soft-border light graft), confirmed against real screens by the in-app prototype pass on PR #354 (`src/pages/EditionView/prototype/`, deleted after rollout). Values below are the prototype's confirmed values, extended to the full #319 role set.

## Identity in one paragraph

One skeleton, two color themes. **Dark is the default**: a violet poster ground (radial glow, lighter than today's near-black), lineup-poster energy in the type (Unbounded display, uppercase), a neon lime accent, translucent white-alpha surfaces with hairline borders. **Light** is the same structure on warm off-white `#fafaf7`: solid white cards with soft hairline borders and small shadows, and the accent shifts to olive-green `#4c7a00` (neon lime fails on white; the violet-continuity option was reviewed and rejected in the prototype pass). Typography and spacing do **not** change between themes — only color tokens do.

## Theme mechanics (CSS contract)

- Token values are CSS variables scoped to the edition-view root. Dark values are the default; light values apply under an explicit `data-edition-theme="light"` scope on that root.
- Both themes ship. How the theme is chosen (system preference vs in-app toggle) and persisted is a rollout decision — [#322](https://github.com/chiptus/UpLine/issues/322)'s territory. The CSS contract above is what it plugs into.
- Values are stored as HSL triples to match the existing shadcn `hsl(var(--…))` plumbing; hex given here for legibility.

## Palette

All text-role pairs below were checked ≥ 4.5:1 (WCAG AA); ratios noted per row. Outdoor-night legibility (the brief's constraint) is carried by the dark theme's high floor — the text hierarchy stays at 6.8:1 or above, and the status accents (`live` 6.1, `destructive` 6.5), used for dots, badges, and short labels, stay well clear of the 4.5:1 AA line.

### Dark (default)

Ground is a fixed radial gradient `120% 70% at 50% -10%`: `#3d1160` → 55% `#1c0733` → `#120522`. Contrast is checked against `#1c0733` (the dominant mid-stop).

| Token               | Value                   | Contrast         | Notes                                                                                  |
| ------------------- | ----------------------- | ---------------- | -------------------------------------------------------------------------------------- |
| `background`        | `#120522`               | —                | Base under the gradient (`--app-gradient-from/to` recomposed from `#3d1160`/`#120522`) |
| `foreground`        | `#fbf7ff`               | 17.6             |                                                                                        |
| `muted-foreground`  | `#d9c9f2`               | 12.1             |                                                                                        |
| `subtle-foreground` | `#a893cc`               | 6.8              |                                                                                        |
| `surface`           | `rgba(255,255,255,.06)` | —                | Chips, resting cards                                                                   |
| `surface-raised`    | `rgba(255,255,255,.10)` | —                |                                                                                        |
| `surface-active`    | `rgba(255,255,255,.16)` | —                | Hover/pressed/selected                                                                 |
| `popover`           | `#241040`               | —                | Solid sheets, dropdowns, drawers                                                       |
| `border`            | `rgba(255,255,255,.18)` | —                | Hairline                                                                               |
| `border-strong`     | `rgba(255,255,255,.36)` | —                | Selected outlines                                                                      |
| `ring`              | `#c6f542`               | —                | Focus ring = accent                                                                    |
| `accent`            | `#c6f542`               | 14.7 (on ground) | Neon lime; fills use `accent-foreground` text                                          |
| `accent-foreground` | `#1a2400`               | 12.8 (on accent) |                                                                                        |
| `accent-soft`       | `rgba(198,245,66,.16)`  | —                | Selected/hover chip wash; text on it stays `foreground` or `accent`                    |
| `live`              | `#ff4fa3`               | 6.1              | Magenta-pink; unifies today's fuchsia/red split                                        |
| `live-foreground`   | `#ffd9ec`               | 13.7             | Text next to/over live washes                                                          |
| `notice`            | `#ffc53d`               | 11.8             | Amber                                                                                  |
| `notice-foreground` | `#2b1f00`               | — (on notice)    | For solid notice fills                                                                 |
| `destructive`       | `#ff6b6b`               | 6.5              |                                                                                        |

### Light

Flat ground `#fafaf7`, solid white surfaces, soft borders + small shadows (the neutral-direction graft). Contrast checked against `#ffffff` (card) — the stricter case.

| Token               | Value                | Contrast        | Notes                                                                           |
| ------------------- | -------------------- | --------------- | ------------------------------------------------------------------------------- |
| `background`        | `#fafaf7`            | —               | Flat, no gradient                                                               |
| `foreground`        | `#1a1c22`            | 16.3            |                                                                                 |
| `muted-foreground`  | `#484d59`            | 8.5             |                                                                                 |
| `subtle-foreground` | `#676d7a`            | 5.2             |                                                                                 |
| `surface`           | `#ffffff`            | —               | + `border` + shadow (see component rules)                                       |
| `surface-raised`    | `#ffffff`            | —               | Elevation via shadow, not tint                                                  |
| `surface-active`    | `#f1f2ee`            | —               | Hover/pressed/selected tint                                                     |
| `popover`           | `#ffffff`            | —               |                                                                                 |
| `border`            | `#dcdfe3`            | —               | Hairline                                                                        |
| `border-strong`     | `#b7bcc4`            | —               |                                                                                 |
| `ring`              | `#4c7a00`            | —               |                                                                                 |
| `accent`            | `#4c7a00`            | 5.1             | Olive-green (decided in prototype pass; closes #320's violet-vs-green question) |
| `accent-foreground` | `#ffffff`            | 5.1 (on accent) |                                                                                 |
| `accent-soft`       | `rgba(76,122,0,.12)` | —               |                                                                                 |
| `live`              | `#d61f7e`            | 4.8             |                                                                                 |
| `live-foreground`   | `#8f0f52`            | 8.2             |                                                                                 |
| `notice`            | `#8a5f00`            | 5.7             | Amber, darkened for white ground                                                |
| `notice-foreground` | `#ffffff`            | — (on notice)   |                                                                                 |
| `destructive`       | `#c92a2a`            | 5.9             |                                                                                 |

### Vote triad

Initial values keep today's hues (orange / blue / gray), tuned per theme for AA on their ground; consumed via `src/lib/voteConfig.ts` (SetDetails/groups shift along). Exact tuning is an implementation detail inside the family contract: `vote-*` (solid), `vote-*-foreground` (legible text/icon on ground), `vote-*-soft` (translucent card/chip wash).

| Family            | Dark base | Light base |
| ----------------- | --------- | ---------- |
| `vote-must`       | `#ff9f45` | `#b45309`  |
| `vote-interested` | `#6fb5ff` | `#1d63c4`  |
| `vote-skip`       | `#9aa0ab` | `#5b616c`  |

Third-party brand colors (Spotify, SoundCloud, …) stay literal, per #319.

## Typography

Same in both themes.

- **Display** (`h1`, `h2`, hero artist names, day-strip labels): **Unbounded** 500/700, uppercase, `letter-spacing: 0.02em`. Fallback `"Arial Black", system-ui, sans-serif`.
- **Body & UI** (everything else): **Space Grotesk** 400/500/700. Fallback `"Segoe UI", system-ui, sans-serif`.
- Loaded via Google Fonts (self-hosting is a rollout option, not a spec requirement). Only these two families and weights — Bricolage/Public Sans were the rejected hybrid's.
- No new type-scale system: existing Tailwind size classes stay; the identity change is family + case + tracking on the display level.
- Display type is reserved for the poster moments (hero, section headers, day strip). Card titles, list rows, and controls stay in Space Grotesk so density screens (Schedule List/Timeline) stay legible.

## Component styling

- **Radius:** single knob — `--radius: 12px` (so Tailwind `lg` = 12px, `md` = 10px, `sm` = 8px), the prototype's confirmed softening of the mockups' 18/14px. Committed as the shipped default; it remains one token to tweak.
- **Cards & chips (dark):** `surface` fill + `border` hairline; no shadows — depth comes from the alpha steps (`surface` → `surface-raised` → `surface-active`).
- **Cards & chips (light):** white fill + `border` hairline + `box-shadow: 0 1px 3px rgba(0,0,0,.07)`. Elevation raises the shadow, never a gray tint.
- **Buttons/CTAs:** primary = solid `accent` with `accent-foreground` text; secondary = `surface-raised` + `border`; selected toggles = `accent` solid (primary actions) or `accent-soft` + `border-strong` (filter chips).
- **Hero:** lineup-poster treatment — stacked artist names in Unbounded over the violet glow (dark) / on `#fafaf7` (light); live state uses `live` dot + `live-foreground` text.
- **Day strip:** wristband treatment — a horizontal band of day chips; selected day = `accent` solid, others = `surface` + `border`.
- **Badges & status:** `live` for happening-now (hero dot, Now button, current-time indicator), `notice` for non-urgent attention (refresh, tab dots, festival-mode badge), `destructive` for clearing/danger.
- **Density:** unchanged — this is a re-skin, not a spacing rethink (IA/nav restructure is out of scope on the map).

## What implementation consumes

1. Token values above land in `src/index.css` under the edition scope, replacing the roles named in `edition-color-vocabulary.md`'s "absorbs today" mapping (~350 occurrences / 60 files per the #319 audit).
2. `tailwind.config.ts` gains the new role names (`surface*`, `subtle-foreground`, `border-strong`, `accent-soft`, `live*`, `notice*`, `vote-*`).
3. Font families wired once at the edition-view root; display styling via the heading rules above.
4. The prototype directory `src/pages/EditionView/prototype/` and its wiring are deleted once the real implementation lands.

How this is sliced into PRs (tokenize-then-flip vs surface-by-surface, and #230's fate) is [#322](https://github.com/chiptus/UpLine/issues/322).

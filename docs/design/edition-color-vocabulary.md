# Semantic color vocabulary for the edition views

Resolution of [#319](https://github.com/chiptus/UpLine/issues/319), part of the visual-identity wayfinder map [#317](https://github.com/chiptus/UpLine/issues/317).

This names the **roles** colors play in the voter-facing edition views, independent of which palette fills them. The direction spec (#321) and the tokenization migration (#230) are written in this language.

## Ground rules

- **Reuse and retheme the existing shadcn token names** where a role already exists (`background`, `foreground`, `muted-foreground`, `border`, `ring`, `popover`, `accent`, `destructive`). New names are added only for roles shadcn doesn't cover. No `ed-*` namespace.
- **No numeric ramps.** Each role is one value per theme; "lighter/darker" variants are expressed as alpha on the base token (Tailwind `/NN` over an HSL var) or as an explicit `-soft` companion, not as `-100…-900` scales.
- **`/NN` opacity modifiers work only on opaque roles** (`foreground`, `accent`, `live`, `vote-must`, …). The inherently translucent roles (`surface`/`surface-raised`/`surface-active`, `accent-soft`, `border`/`border-strong`, `*-soft`) carry their alpha inside the CSS variable, so `bg-surface/50` expands to a double-alpha `hsl(… / 0.05 / .5)` — silently invalid CSS. Use the next step in the role family (`surface` → `surface-raised` → `surface-active`) instead of a modifier.
- **The tokens live on `:root`, not a scope class (#367).** The tokens are app-wide — including admin and Radix portal content — with dark values as the default. Setting `data-theme="light"` on the document root selects the light values (#359); the header theme toggle manages that attribute.
- Values below reference today's hardcoded classes only to define the mapping; the actual palette is chosen in #320/#321.

## Token set

### Ground & text hierarchy

| Token                                              | Role                                         | Absorbs today                                            |
| -------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------- |
| `background` (+ existing `--app-gradient-from/to`) | Page ground; the gradient composes over it.  | Explore's hardcoded `from-purple-900 to-black`           |
| `foreground`                                       | Primary text/icons on the ground             | `text-white`, `text-purple-50`, `text-purple-100`        |
| `muted-foreground`                                 | Secondary text                               | `text-purple-200`, `text-purple-100/80`                  |
| `subtle-foreground` **(new)**                      | Tertiary: labels, hint icons, faint metadata | `text-purple-300`, `text-purple-200/60`, `text-gray-400` |

### Surfaces

| Token                      | Role                                      | Absorbs today                                    |
| -------------------------- | ----------------------------------------- | ------------------------------------------------ |
| `surface` **(new)**        | Resting raised layer (chips, cards)       | `bg-white/5`, `bg-purple-900/60`                 |
| `surface-raised` **(new)** | Emphasized layer                          | `bg-white/10`, `bg-white/15`, `bg-purple-800/50` |
| `surface-active` **(new)** | Hover/pressed/selected layer              | `bg-white/20`, `bg-white/30`                     |
| `popover` (existing)       | Solid floating sheets, dropdowns, drawers | `bg-gray-800`, `bg-gray-900`, `bg-gray-900/95`   |

`paper-background` / `paper-foreground` / `paper-muted-foreground` / `paper-border` **(new, admin/auth only)** are a stopgap for shared shadcn primitives (`Dialog`, `Input`, `InputOTP`, `Table`, toasts, `AuthDialog`) that render on a plain white chrome surface outside the edition views and were left invisible when `background`/`foreground`/`muted-foreground`/`border` were repointed to the dark identity. Named `paper-*` (not `surface-*`) specifically to avoid colliding with the `surface`/`surface-raised`/`surface-active` overlay-fill family above — those are translucent layers on the dark ground, `paper-*` is an opaque light page/dialog background, and the two are unrelated roles that happen to share a domain vocabulary. They're hardcoded grays/white today, not theme-aware. Once the light/dark flip (#359) lands, fold them into `background`/`foreground`/`muted-foreground`/`border` (scoped to the light theme value) and delete this family.

### Borders & focus

| Token                     | Role                         | Absorbs today                                                              |
| ------------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| `border`                  | Default hairline             | `border-purple-400/20`, `border-purple-400/30`                             |
| `border-strong` **(new)** | Emphasis / selected outlines | `border-purple-400/40`–`/50`, `border-purple-400`, `border-white/50`–`/80` |
| `ring`                    | Focus/selection ring         | `ring-purple-400`, `ring-white`                                            |

A hairline drawn in `border-white/NN` (not purple) doesn't fit either border role — reach for `border-foreground/NN` instead: `foreground` is opaque and already carries today's white value, so the opacity modifier reproduces the exact color without borrowing a fill role (`surface`) for a border.

### Brand accent (interactive)

| Token                          | Role                                             | Absorbs today                                      |
| ------------------------------ | ------------------------------------------------ | -------------------------------------------------- |
| `accent` / `accent-foreground` | Primary interactive fill: selected toggles, CTAs | `bg-purple-600`, `bg-purple-400`                   |
| `accent-hover`                 | Hover state for the accent fill                  | `hover:bg-purple-700`                              |
| `accent-soft` **(new)**        | Translucent accent wash for selected/hover chips | `bg-purple-600/30`–`/60`, `bg-purple-400/10`–`/30` |
| `text-accent`                  | Accent-colored text/icons                        | `text-purple-400`                                  |

(`accent` is repurposed from shadcn's neutral hover-gray to the brand accent; edition views don't use the old meaning.)

### Status roles

| Token                          | Role                                                                                                     | Absorbs today                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `live` / `live-foreground`     | Happening-now: hero Live dot, Now button, current-time indicator — **unifies** today's fuchsia/red split | `bg-fuchsia-400`, `text-fuchsia-100/200`, hero `bg-red-500` + `text-red-200` |
| `notice` / `notice-foreground` | Attention, non-urgent: new-data refresh, tab-indicator dots, festival-mode badge, empty-state sparkle    | `bg-amber-400`, orange refresh/badge classes, `text-yellow-400`              |
| `destructive` (existing)       | Dangerous/clearing actions                                                                               | `text-red-400`/`300`, `bg-red-400/10`                                        |

### Vote triad

Vote colors become token families consumed by `src/lib/voteConfig.ts` (shared with SetDetails/groups, which shift along):

| Family                                      | Vote            | Initial value  |
| ------------------------------------------- | --------------- | -------------- |
| `vote-must` / `-foreground` / `-soft`       | Must Go (+2)    | today's orange |
| `vote-interested` / `-foreground` / `-soft` | Interested (+1) | today's blue   |
| `vote-skip` / `-foreground` / `-soft`       | Won't Go (−1)   | today's gray   |

`-soft` is the translucent card/chip wash; `-foreground` is legible text/icon on the ground.

### Stays literal

Third-party brand colors (Spotify green, SoundCloud orange, etc. in `SocialPlatformUtils.tsx`) remain hardcoded — they belong to those brands, not this identity.

## Audit snapshot (2026-08-20)

~350 hardcoded color-class occurrences across 60 files under `src/pages/EditionView` (the map's "~54/29" was stale). Top offenders: `text-purple-300` (43), `text-purple-100` (41), `text-purple-200` (29), `border-purple-400/30` (24), `text-white` (23), `bg-white/10` (20). Full frequency table in the #319 resolution comment.

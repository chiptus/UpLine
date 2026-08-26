# Terminology Audit: "Artist"-Assuming UI Strings

Research for wayfinder ticket #401 (child of #312, "other kinds of 'sets' like
workshops, performances or no artist set"). Catalogs every user-facing UI
string in the codebase that assumes "artist" as the subject, for components
that render sets / set cards / set detail pages, plus adjacent controls
(sort/filter copy, multi-select placeholders). Copy is **not** rewritten here
— this is the input list for later copy-rewrite work.

Scope note: admin CRUD screens dedicated to artist management (`src/pages/admin/ArtistsManagement/**`,
`src/routes/admin/artists*`, artist merge/dedup tooling) are artist-specific
by design (artists are still a real underlying entity — a person/act — even
if a "set" can be of a non-music type). Those are excluded except where the
same components/copy leak into set-authoring flows (e.g. `SetFormDialog`,
`ArtistMultiSelect`, `SetsTable`), which are included because they render
inside set creation/management.

## Legend

- **Generalize once** — a single wording change to "set(s)" (or set-type-neutral
  language) covers all set types, no per-type variants needed.
- **Per-type variant** — the string's meaning depends on there being a music
  artist (e.g. "artists", "electronic artists", genre/social-link references)
  and needs different copy per set type (music/workshop/performance/other).

## Findings

### Voting tab — empty state

**`src/pages/EditionView/tabs/VoteTab/EmptyArtistsState.tsx`**

| Line | Text                                                            | Needs                                                                                                                                                                   |
| ---- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 22   | `No Artists Yet`                                                | Generalize once → "No Sets Yet"                                                                                                                                         |
| 25   | `Be the first to add artists to the Boom Festival voting list!` | Generalize once → "...add sets to the ... voting list!"                                                                                                                 |
| 36   | `Discover new electronic artists`                               | Per-type variant — "electronic artists" is music-specific; a workshop/performance/other equivalent needs different wording (or drop this bullet for non-music editions) |
| —    | Icons: `Music` (main icon) + `Sparkles` badge                   | Per-type variant — icon choice assumes music; would need a set-type-aware icon                                                                                          |

Component/file name itself (`EmptyArtistsState`) and its import site
`src/pages/EditionView/tabs/VoteTab/SetsPanel.tsx:3,17` reference "Artists"
terminology — rename is a later implementation concern, not a string, but
worth flagging as it will need to become e.g. `EmptySetsState`.

### Voting tab — sort controls

**`src/pages/EditionView/tabs/VoteTab/filters/SortControls.tsx`**

| Line    | Text                                                                           | Needs                                                                                                     |
| ------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| 97      | `Sort artists alphabetically from A to Z`                                      | Generalize once → "Sort sets alphabetically..."                                                           |
| 109     | `Sort artists alphabetically from Z to A`                                      | Generalize once → "Sort sets alphabetically..."                                                           |
| 86      | `Sort Options Explained` (heading)                                             | Already generic, no change needed                                                                         |
| 118–123 | "Highest Rated" / "weighted average rating based on votes..."                  | Already generic (talks about votes, not artists)                                                          |
| 130–137 | "Most Popular" / weighted popularity score copy                                | Already generic                                                                                           |
| 143–148 | "By Date" / "Sort by estimated performance date (earliest performances first)" | Already generic — "performance" here is used as the generic scheduling term, reads fine for all set types |

**`src/pages/EditionView/tabs/VoteTab/filters/constants.ts`** — `SORT_OPTIONS`
labels ("Name (A-Z)", "Name (Z-A)", "Highest Rated", "Most Popular", "By
Date") are already generic, no change needed.

### Voting tab — set cards

**`src/pages/EditionView/tabs/VoteTab/SetCard/SetDescription.tsx`**

| Line | Text                                        | Needs                                                                                                                             |
| ---- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 27   | `Artists:` (label before `MultiArtistInfo`) | Per-type variant — should read "Facilitators:"/"Performers:"/"With:" etc. depending on set type when multiple people are involved |

**`src/pages/EditionView/tabs/VoteTab/SetCard/SocialPlatformLink.tsx`**

| Line | Text                                                         | Needs                                                                                                                                     |
| ---- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 30   | ``title={`Open ${artistName} in ${platformInfo.platform}`}`` | Per-type variant — assumes a Spotify/SoundCloud-style social link exists per person; non-music set types may not have this concept at all |

Other files in this folder (`SetHeader.tsx`, `SetImage.tsx`, `SetMetadata.tsx`,
`MultiArtistInfo.tsx`, `SocialPlatformLinkList.tsx`) use "artist" only in
variable/prop/type names (`isMultiArtist`, `artist.name`, `Artist` interface,
`set.artists`), not in rendered copy — no UI string to catalog, but these
identifiers will need renaming alongside any data-model terminology work.

**`src/pages/EditionView/tabs/VoteTab/SetListItem.tsx:11`** — `data-testid="artist-item"`
and **`SetsPanel.tsx:21`** — `data-testid="artists-list"`: not user-visible
copy, but test-id strings baked into E2E selectors; flagging since a rename
sweep will need to touch `tests/**` in lockstep. Not part of the copy-rewrite
scope proper.

### Set details page

**`src/pages/SetDetails/SetNotes.tsx:52`**

| Text                                                 | Needs                                                                                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `Notes from you and group members about this artist` | Per-type variant (or generalize to "about this set" — reads fine for all types since notes are on the set, not tied to who performs) |

**`src/pages/SetDetails/notes/CreateNoteForm.tsx:25`**

| Text                                                   | Needs                                                           |
| ------------------------------------------------------ | --------------------------------------------------------------- |
| `placeholder="Add your thoughts about this artist..."` | Generalize once → "...about this set..." (notes are set-scoped) |

**`src/pages/SetDetails/SetGroupVoting.tsx`**

| Line | Text                                                 | Needs                                                                        |
| ---- | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| 65   | `` `How ${activeGroup.name} voted on this artist` `` | Generalize once → "...voted on this set"                                     |
| 76   | `No one in this group has voted on this artist yet.` | Generalize once → "...voted on this set yet."                                |
| —    | Prop/var name `artistId` (aliased from `setId`)      | Not copy, but a misleading identifier worth flagging for a later rename pass |

**`src/pages/SetDetails/MultiArtistSetInfoCard.tsx`**

| Line | Text                                         | Needs                                                                                                               |
| ---- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 73   | `{set.artists.length} Artists` (badge/count) | Per-type variant — "Artists" count label; workshop/performance sets would want "Facilitators"/"Performers"/"People" |
| 140  | `Artists in this Set` (section heading)      | Per-type variant — same as above                                                                                    |

**`src/pages/SetDetails/SetImageCard.tsx`** — component named `ArtistImageCard`,
prop `artistName`; no separate rendered string beyond `alt={artistName}`
(accessibility text, inherits whatever name is passed in — fine once the
component is fed a person/entity name generically).

### Explore page — set cards

**`src/pages/ExploreSetPage/SetExploreCard/SupportingArtists.tsx:20`**

| Text                                                                                           | Needs                                                                                                                                         |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `{artists.length === 1 ? "With" : "With"}` (both branches identical — likely dead ternary/bug) | Generalize once → "With" already type-neutral; worth flagging the redundant ternary as an unrelated code-quality nit, not a terminology issue |

No other rendered strings in `PrimaryArtistDisplay.tsx` / `SetExploreCard.tsx`
beyond `artist.name`, `artist.description` (data, not hardcoded copy).

### Schedule tab

**`src/pages/EditionView/tabs/ScheduleTab/list/MobileSetCard.tsx:27`** —
`{/* Artist name */}` is a code comment, not rendered copy; no user-facing
string here assumes "artist" specifically (renders `set.artists` data).

### Route-level headings / navigation

**`src/routes/festivals/$festivalSlug/index.tsx:211`**

| Text                                                                | Needs                                                                                                                                                                                                      |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Vote on your favorite artists and collaborate with your community` | Per-type variant — landing/marketing copy assumes music artists; needs rewording for editions with workshop/performance/other sets (or a set-type-aware/neutral phrasing like "acts", "sets", "programme") |

**`src/routes/festivals/$festivalSlug/editions/$editionSlug/sets/index.tsx:40`**

| Text                 | Needs                               |
| -------------------- | ----------------------------------- |
| `Loading artists...` | Generalize once → "Loading sets..." |

**`src/routes/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug.tsx:70`**

| Text                                               | Needs                            |
| -------------------------------------------------- | -------------------------------- |
| `backLabel="Back to Artists"` (TopBar back button) | Generalize once → "Back to Sets" |

### Set creation/management (admin, but touches set-authoring copy)

**`src/pages/admin/festivals/SetsManagement/ArtistMultiSelect.tsx`**

| Line | Text                                               | Needs                                                                                                                                                                                                                              |
| ---- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 21   | `placeholder = "Select artists..."` (default prop) | Per-type variant if this component is reused for non-music sets — component itself is named/scoped to artists; a set-type-agnostic version would need a generic "Select people..." (or a differently-named component per set type) |
| 31   | `searchPlaceholder="Search artists..."`            | Per-type variant, same reasoning                                                                                                                                                                                                   |
| 32   | `emptyMessage="No artists found."`                 | Per-type variant, same reasoning                                                                                                                                                                                                   |

**`src/pages/admin/festivals/SetFormDialog.tsx`**

| Line    | Text                                                                                      | Needs                                                                                                                                             |
| ------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 217     | `"Update the set details, artists, and scheduling information."`                          | Per-type variant — "artists" specifically named                                                                                                   |
| 218     | `"Create a new set by first selecting artists, then configuring details and scheduling."` | Per-type variant                                                                                                                                  |
| 229     | `<FormLabel>Artists in Set</FormLabel>`                                                   | Per-type variant                                                                                                                                  |
| 244     | `placeholder="Select artists for this set..."`                                            | Per-type variant                                                                                                                                  |
| 272     | `"Name will be auto-generated from selected artists"`                                     | Per-type variant                                                                                                                                  |
| 128–141 | `generateSetName` — builds set name from artist names (`"X vs Y"`, `"X + N more"`)        | Not a rendered string but a naming _behavior_ that assumes music-artist-style set naming; flag for later logic-level (not just copy-level) rework |

**`src/pages/admin/festivals/SetsTable.tsx`**

| Line | Text                             | Needs                                                             |
| ---- | -------------------------------- | ----------------------------------------------------------------- |
| 63   | `<TableHead>Artists</TableHead>` | Per-type variant — column header for the people/entities in a set |

## Summary table

| File                                                               | Needs                                   |
| ------------------------------------------------------------------ | --------------------------------------- |
| `EmptyArtistsState.tsx` (heading, subtext)                         | Generalize once                         |
| `EmptyArtistsState.tsx` ("electronic artists" bullet + icon)       | Per-type variant                        |
| `SortControls.tsx` (both "Sort artists alphabetically" lines)      | Generalize once                         |
| `SetCard/SetDescription.tsx` ("Artists:" label)                    | Per-type variant                        |
| `SetCard/SocialPlatformLink.tsx` (title attr)                      | Per-type variant                        |
| `SetDetails/SetNotes.tsx`                                          | Generalize once (or per-type, arguable) |
| `SetDetails/notes/CreateNoteForm.tsx` (placeholder)                | Generalize once                         |
| `SetDetails/SetGroupVoting.tsx` (both strings)                     | Generalize once                         |
| `SetDetails/MultiArtistSetInfoCard.tsx` (count badge + heading)    | Per-type variant                        |
| `ExploreSetPage/SetExploreCard/SupportingArtists.tsx` ("With")     | Already fine, flag ternary nit only     |
| `routes/.../$festivalSlug/index.tsx` (hero copy)                   | Per-type variant                        |
| `routes/.../sets/index.tsx` ("Loading artists...")                 | Generalize once                         |
| `routes/.../sets/$setSlug.tsx` ("Back to Artists")                 | Generalize once                         |
| `admin/festivals/SetsManagement/ArtistMultiSelect.tsx` (3 strings) | Per-type variant                        |
| `admin/festivals/SetFormDialog.tsx` (5 strings + naming logic)     | Per-type variant                        |
| `admin/festivals/SetsTable.tsx` ("Artists" column)                 | Per-type variant                        |

## Out of scope / not catalogued as copy

- Variable, prop, type, and component names (`artist`, `Artist`, `artistId`,
  `isMultiArtist`, `ArtistImageLoader`, `MixedArtistImage`, etc.) — these are
  identifiers, not rendered strings, though a full terminology migration will
  eventually need to rename them too.
- `data-testid` values (`artist-item`, `artists-list`) — test selectors, not
  UI copy; would need a coordinated rename with `tests/**`.
- Dedicated artist-management admin screens (`src/pages/admin/ArtistsManagement/**`,
  `src/routes/admin/artists*`, dedup/merge tooling) — these manage the artist
  entity itself, not set-type-specific rendering, and were left out per the
  ticket's focus on "sets/set cards/set detail pages".
- API/query naming (`artistNotesQuery`, `useArtistsQuery`, `/api/artist-notes/**`)
  — backend/data-layer naming, not UI copy.

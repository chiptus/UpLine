# UpLine

Collaborative festival voting platform. Core Team curates a lineup; festival-goers vote on artists and (later) coordinate around set times.

## Language

**Festival**:
A recurring music festival (e.g. Boom). Has many editions over time.
_Avoid_: Event

**Edition**:
A single instance of a festival in a given year (e.g. Boom 2025). Owns its own lineup, schedule, stages, and voting.
_Avoid_: Year, instance, event

**Festival timezone**:
The IANA timezone (e.g. `Europe/Lisbon`) in which a **festival** physically takes place. Set once per festival and inherited by all its **editions**. Set times are stored as UTC but always _displayed_ in the festival timezone, so every viewer sees the same wall-clock time regardless of their own location.
_Avoid_: Local time (ambiguous — means the viewer's zone), user timezone

**Lineup**:
The set of artists associated with an edition. Visible to voters once the edition is published.
_Avoid_: Roster, bill

**Schedule**:
The arrangement of an edition's **sets** across **stages** and time. Presented to users via the Now, Timeline, and List views on the Schedule tab. Not a stored entity — derived from sets + stages of an edition.
_Avoid_: Lineup (lineup = who; schedule = when/where), program, timetable

**Festival phase**:
Which stage of its lifecycle an **edition** is in. An ordered, derived concept (parallel to how **Schedule** is derived) — not a stored entity and not a column. Computed from the edition's **schedule reveal level**, `start_date`/`end_date`, and the **festival timezone** at the current time. Four ordered values: **Pre-Schedule → Planning → Live → Post-Festival**. `draft` reveal level ⇒ Pre-Schedule; before the festival ⇒ Planning; during (with grace before/after) ⇒ Live; after ⇒ Post-Festival. See ADR-0003.
_Avoid_: Status, state, stage (stage = a venue), stored phase

**Set**:
A single scheduled performance within an edition, with one or more artists, a stage, and a start/end time.
_Avoid_: Show, gig, slot, performance

**Stage**:
A named venue/space within an edition where sets take place.
_Avoid_: Venue, room

**Vote**:
A user's reaction to an artist. Three values: "Must Go" (+2), "Interested" (+1), "Won't Go" (-1). A vote belongs to the voting user alone — it is never scoped to a Group; Groups only change whose votes are being looked at, never which votes exist. Anticipatory — answers "will I go." See Retrospective rating for the after-the-fact counterpart.
_Avoid_: Rating, like

**Retrospective rating**:
A user's after-the-fact reaction to a **set** — "how was it" — recorded once the edition is Post-Festival. Distinct from **Vote**: Vote is anticipatory ("will I go", drives planning points) while a rating answers "did I like it" and never affects or is affected by a Vote on the same set. Stored in its own `set_ratings` table with its own scale (loved / liked / meh), never the Vote scale or copy. See ADR-0004.
_Avoid_: Vote, score

**Group**:
A festival-agnostic crew of users who share votes and notes for collaborative decision-making. Not tied to any festival or edition — the same group carries over to whatever editions its members attend. A user can belong to several Groups at once (e.g. a standing group of friends across festivals, plus a group formed just for one edition's crew).
_Avoid_: Team, party, edition group

**Active Group**:
The one Group a user is currently viewing the app "as" — the group whose votes feed Vote Perspective and Vote Scope on any given screen. Global to the user (not per-edition), persisted, and defaults to the user's only Group when they have exactly one. Choosing a different Group anywhere always replaces it — there is no separate, non-persisting "peek" mode. A user with no Groups has no Active Group. See ADR-0005.
_Avoid_: Selected group, current group, group filter

**Vote Perspective**:
On the Artists tab, which votes are aggregated into a set's rating and popularity score: Everyone, or the Active Group. Perspective re-scores and re-sorts; it never hides sets. See ADR-0005.
_Avoid_: Group filter, rating scope

**Vote Scope**:
On the Schedule tab, whose votes the vote-type filter chips (Must Go / Interested / Won't Go) match against: Me, or the Active Group. Under Me, a chip matches the current user's own vote. Under the Active Group, a chip matches if _any_ member of the Active Group (the current user included) cast that vote type. Scope filters — it hides sets that don't match a selected chip. Distinct from Vote Perspective: each tab keeps its own Me/Group(Everyone) choice independently, both drawing on the same Active Group. See ADR-0005.
_Avoid_: Group filter, vote filter

**Core Team**:
Admin users who curate editions, manage the lineup, and import the schedule.
_Avoid_: Staff, organizers, moderators

### Publish states

An edition has two independent publish states.

**Edition published**:
The edition's lineup is publicly visible and voting is open. Users can read artists and vote. A boolean.
_Avoid_: Live, released

**Schedule reveal level**:
How much of the **schedule** (set times + stage assignments) is exposed to the public for this edition. Independent of edition published — the lineup can be live while the schedule is still hidden. An ordered enum, not a boolean. Levels (low → high):

1. **`draft`** — no schedule info revealed beyond the artist/set existing.
2. **`days`** — the day each set takes place is visible. Stage and time-of-day are hidden.
3. **`stages`** — day + stage are visible ("Artist X plays Main Stage on Friday"). Exact start/end time hidden. Implies `days`.
4. **`full`** — exact start/end times are visible. Implies `stages`.

Each level reveals strictly more than the previous. There is no "stages without days" state.
_Avoid_: Schedule released, schedule published (as a boolean), timetable live

## Example dialogue

> **Dev**: For Boom 2025, when do users first see the artists?
> **Domain**: As soon as the **edition** is **published**. They can read the **lineup** and start voting. The schedule reveal level is still `draft` at that point.
> **Dev**: When do set times show up?
> **Domain**: We move the **schedule reveal level** in steps. First we bump to `days` so people see which day each artist plays. Closer to the festival we bump to `stages` — now they know which stage too. The day before, we go to `full` and exact start/end times are public.
> **Dev**: So `stages` doesn't reveal times?
> **Domain**: Right. You see "Artist X, Friday, Main Stage" but not "18:00". Times only appear at `full`.

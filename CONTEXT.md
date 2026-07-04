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
The arrangement of an edition's **sets** across **stages** and time. Presented to users via the Timeline and List views on the Schedule tab. Not a stored entity — derived from sets + stages of an edition.
_Avoid_: Lineup (lineup = who; schedule = when/where), program, timetable

**Set**:
A single scheduled performance within an edition, with one or more artists, a stage, and a start/end time.
_Avoid_: Show, gig, slot, performance

**Stage**:
A named venue/space within an edition where sets take place.
_Avoid_: Venue, room

**Vote**:
A user's reaction to an artist within a group context. Three values: "Must Go" (+2), "Interested" (+1), "Won't Go" (-1).
_Avoid_: Rating, like

**Group**:
A collection of users who share votes and notes for collaborative decision-making within an edition.
_Avoid_: Team, party

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

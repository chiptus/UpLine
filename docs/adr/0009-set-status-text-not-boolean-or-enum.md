# Set status is text + CHECK, not a boolean or a native enum

`sets.status` (added for #45, date-only "time TBA" sets) is `text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tba'))`, not a boolean and not a native Postgres `CREATE TYPE ... AS ENUM`.

## Considered Options

- **Boolean `time_tba`** (the original implementation). Rejected: adding a third state later (`cancelled`, already anticipated — see **Set status** in CONTEXT.md) would require a second column or a breaking rename, since a boolean has no room to grow.
- **Native Postgres enum.** Rejected: no precedent elsewhere in this schema (the closest existing "kind" column, `set_type`, is plain `text`), and extending an enum's values is more disruptive than extending a `CHECK` list — adding a value can't be used in the same transaction that adds it, and removing/renaming a value requires recreating the type and touching every dependent column.
- **Sentinel values on `time_start`/`time_end`** (e.g. `time_end = time_start + 1 minute`, or `time_start = time_end`). Rejected: encodes meaning in a magic value instead of an explicit column — illegible in a raw row or a SQL query, un-enforceable by any constraint, and collides with legitimate sets that happen to have that exact time shape.
- **Merging into `sets.archived`** (one `confirmed/tba/cancelled/archived` column). Rejected: `archived` is a cross-entity soft-delete flag (shared with `festivals`/`festival_editions`/`stages`) answering "is this record still part of the current import," orthogonal to `status`'s "what is this set's standing." Conflating them forces every consumer to unpack one field for two unrelated questions.

## Consequences

- Extending to a third value (`cancelled`) is a one-line `CHECK` change, not a migration touching a dependent type or a new column.
- `status` and `archived` stay independent: a set can be archived regardless of its status, and vice versa.

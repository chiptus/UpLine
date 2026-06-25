# Feature-sliced `src/api` modules for data access

The data-access layer moves from `src/hooks/queries/` to a feature-sliced
**`src/api/`** module. Each feature is a flat directory (nested sub-features like
`festivals/editions/` are promoted to top-level siblings such as `editions/`).
Per feature, a shared `types.ts` holds the entity Row type plus the query-key
factory; every endpoint is one self-contained file (keeping its `use`-prefixed
name) that holds, together, the endpoint's request/response types, the
`fetchX`/mutate function, a per-file `queryOptions` factory, and the hook that
consumes that factory.

We chose this over keeping `src/hooks/queries/` and merely adding factories
because we want a single source of truth per query that feeds both route loaders
(`ensureQueryData`) and components (`useQuery`/`useSuspenseQuery`) without import
cycles, and because these files are now more than hooks. Co-locating the factory
with the hook (both importing keys/types from the pure `types.ts`) avoids the
`types.ts ↔ useX.ts` cycle that a factory-in-`types.ts` layout would create.

This deliberately deviates from the `src/hooks/queries/` convention in CLAUDE.md
(which should be updated when the restructure lands), so it is recorded here to
explain why the layer no longer lives under `hooks/` and why `types.ts` now
carries runtime query logic.

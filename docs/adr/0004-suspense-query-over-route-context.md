# Read router-resolved domain data via `useSuspenseQuery`, not Context or `useRouteContext`

`FestivalEditionContext` wrapped `festivals/$festivalSlug` with a `Provider` that
re-fetched the current edition via a plain `useQuery`, exposing `{ festival,
edition }` through a `useFestivalEdition()` hook. Meanwhile the child route
already resolved the *same* edition in `beforeLoad` (via `ensureQueryData`) to
compute a phase-based redirect before any component renders — an independent,
mandatory read that the Context could not replace or subsume. The two
mechanisms diverged in semantics (`isLoading`/`error` vs. Suspense) for what
was really one entity.

Decision: components read festival/edition data with `useSuspenseQuery` against
the shared `queryOptions` factories (`festivalBySlugQuery`,
`editionBySlugQuery`), obtaining the slug params via typed
`useParams({ from: "<route-id>" })` — never `Route.useRouteContext()`, never a
domain Context, and never `useParams({ strict: false })`.

Two alternatives were considered and rejected:

- **`Route.useRouteContext()`**: couples every call site to its exact position
  in the route tree — a component reused at different nesting depths, or one
  that isn't the route's own colocated component, has no direct way to declare
  "the route above me put `edition` in context." `useSuspenseQuery` reads the
  query cache directly, so call sites are decoupled from where they sit in the
  tree.
- **Keep the Context, but make its internals `useSuspenseQuery`**: doesn't
  remove the duplication, it just makes both copies Suspense-flavored. The
  router's `beforeLoad` still has to independently `ensureQueryData` the same
  key for its own pre-render redirect logic, so the Context becomes a second,
  redundant call site around the same cache entry — plus the ongoing cost of a
  `Provider` that must be mounted and threaded with props, and a runtime
  "must be used within a Provider" guard, none of which a plain hook needs.

`useSuspenseQuery` calls here don't require authoring any new Suspense
boundary — TanStack Router already wraps every route match in one via
`defaultPendingComponent` in `main.tsx`, and since `beforeLoad`/`loader`
already resolved the query before the component tree renders, these reads
return synchronously in practice. A Context/Provider has no equivalent
free infrastructure — it must be hand-built per feature.

Consequence: a shared hook (e.g. `useEditionSuspenseQuery`) composing typed
`useParams` with chained `useSuspenseQuery` calls is the right shape for data
needed by many components under a route, rather than a Context. Colocating a
component into its route file (using `Route.useParams()` directly) is only
worth doing when that component *is* the route's own layout/entry component —
not as a substitute for the shared hook elsewhere.

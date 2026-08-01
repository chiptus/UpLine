# Real local Supabase for hook/mutation tests, not mocks

## Context

Query/mutation hook tests mocked the hook module directly (`vi.mock`), coupling tests to implementation details and skipping the hooks' actual mapping/error logic (#64). We considered an MSW boundary mock as the fix, and evaluated `supabase-test`/`pgsql-test` (constructive-io/launchql) for DB-level test isolation.

## Decision

Test query/mutation hooks against a real local Supabase instance (the same stack E2E already uses), not a mocked boundary.

- **No transaction-rollback isolation.** Mutations commit for real — `onSettled`-driven `invalidateQueries` → refetch is core behavior worth testing, and rollback would hide it. Reads need no isolation since nothing is written.
- **Per-test isolation via scoped fixtures.** Each test creates its own uniquely-named data through a shared factory harness (auto-registered for cleanup in `afterEach`), plus a scratch-row pool for common cases — safe under parallel test workers.
- **Auth via admin-minted session.** `supabase.auth.admin.generateLink({ type: 'magiclink' })` + `verifyOtp()`, not real email delivery through Mailpit — fast enough to call per test/file.
- **Renamed test tier: "integration test," not "unit test."** Files: `*.integration.test.ts`. Separate `vitest.integration.config.ts` / `pnpm test:integration`, excluded from the default `vitest.config.ts` (per-PR CI stays fast, no Supabase dependency).
- **CI placement:** a new job on the nightly workflow (`e2e-tests.yml` renamed to `nightly-tests.yml`), reusing its existing cron schedule and `workflow_dispatch` trigger rather than adding a second one.
- **Mocking is a narrow, explicit exception, never the default and never the hook.** Error paths that are cheap to trigger for real (RLS denial, unique-constraint violation, not-found) stay real. A fetch-level mock is allowed only when reproducing the real condition would be disproportionately costly (e.g. genuine network unreachability).

## Considered Options

- **MSW boundary mock** — rejected. Faithfully mocking PostgREST means hand-replicating its query-string encoding (filters/embeds/relations), its `{code,message,details,hint}` error shape, and ordering/range semantics — ongoing labor to keep in sync with the schema, for less fidelity than the real thing.
- **`supabase-test` / `pgsql-test`** — rejected. Confirmed via its docs that it connects directly to Postgres via the `pg` driver and simulates RLS with `SET LOCAL`/`jwt.claims.*`, bypassing PostgREST/HTTP entirely. Good for testing RLS/schema policies directly, but it never exercises the code path `supabase-js` actually runs (URL building, PostgREST's response shape, the hook's mapping of it).

## Consequences

- Query/mutation hook regressions surface on the nightly run, not per-PR — a real trade-off accepted in exchange for testing against the real thing instead of a hand-maintained fake.
- The container/presentational component split (#277) will let today's hook-touching "presentational" tests (`GenreBadge`, `StageBadge`, `StagePin`) drop back to fast/per-PR once they stop calling hooks directly.

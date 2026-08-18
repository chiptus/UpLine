# Integration tests

These tests (`src/**/*.integration.test.ts`) exercise real code against a
manually-started local Supabase instance (`supabase start`) — see the root
`CLAUDE.md` for the `pnpm run test:integration` / `test:setup:full` commands.

## Mocking policy

**No mocks by default.** A test in this tier hits the real local Supabase
instance through the app's real client (`@/integrations/supabase/client`)
and real fixture rows (`fixtures/`). That's the point of the tier: it proves
a hook's actual request shape, RLS behavior, and query-invalidation cycle,
not a stand-in for them.

Error paths are no exception. If a real Postgres/PostgREST condition is
cheap to trigger — RLS denial, a unique-constraint violation, a not-found
row — trigger it for real and assert on the actual error Supabase returns
(see `useVoteMutation.integration.test.ts`'s unauthenticated-insert test for
the pattern). Don't fake the error by mocking the client.

**The one narrow exception:** mocking at the fetch/network boundary is
permitted only for conditions that are impractical to reproduce for real —
genuine network unreachability, a timeout, a malformed response from a
misbehaving server. Even then, mock `fetch` (or an equivalent network
seam), never the Supabase client or a hook itself — the code under test
must still run its real query/mutation logic against a fake transport, not
have that logic replaced outright.

## Fixtures

`fixtures/` holds disposable-row factories (`createArtist`, `createSet`,
`createScratchFestivalEdition`, `linkArtistToSet`) and `signInAsTestUser`
(`fixtures/auth.ts`). Everything they create self-registers its cleanup
with `registerCleanup` (`harness.ts`), which runs in reverse order in
`afterEach` — write fixtures the same way so tests never hand-write
insert/delete or sign-in/sign-out boilerplate.

`signInAsTestUser()` signs the app's own client in as a fresh, uniquely
named user without sending or waiting on any email: it mints a magic-link
token via the service-role admin API and redeems it with the same
`verifyOtp` call the real OTP flow uses. Compare this to the E2E tier's
`TestHelpers.signIn()` (`tests/utils/otp.ts`), which drives the real UI and
polls the local stack's Mailpit inbox — appropriate for an end-to-end
flow test, far too slow for a hook-level integration test that just needs
_some_ authenticated session.

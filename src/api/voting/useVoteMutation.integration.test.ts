import { describe, expect, it } from "vitest";
import { createElement, type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { useVoteMutation } from "./useVoteMutation";
import { userVotesQuery } from "./useUserVotesQuery";
import { userVotesKeys } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { createQueryWrapper } from "@/test/integration/harness";
import { signInAsTestUser } from "@/test/integration/fixtures/auth";
import { createSet } from "@/test/integration/fixtures/sets";
import { SEEDED_USER_ID } from "@/test/integration/fixtures/constants";

describe("useVoteMutation", () => {
  it("commits through a real invalidate -> refetch cycle, not just the mutation's optimistic write", async () => {
    const userId = await signInAsTestUser();
    const setId = await createSet();

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
      return createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );
    }

    const { result } = renderHook(
      () => ({
        vote: useVoteMutation(),
        votes: useQuery(userVotesQuery(userId)),
      }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.votes.isSuccess).toBe(true));

    // Only start watching fetchStatus once the initial mount fetch has
    // settled, so the assertion below isolates activity the mutation causes
    // and doesn't just see that first fetch.
    const fetchStatuses: string[] = [];
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        JSON.stringify(event.query.queryKey) ===
        JSON.stringify(userVotesKeys.user(userId))
      ) {
        fetchStatuses.push(event.query.state.fetchStatus);
      }
    });

    act(() => {
      result.current.vote.mutate({ setId, voteType: 2, userId });
    });

    await waitFor(() => expect(result.current.vote.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.votes.data?.[setId]).toBe(2));

    unsubscribe();

    // The mutation's onMutate writes the optimistic value via setQueryData,
    // which never touches fetchStatus. Only a genuine network refetch (the
    // one onSettled's invalidateQueries triggers) cycles fetchStatus through
    // "fetching". Seeing it here proves the query result above came from a
    // real commit -> invalidate -> refetch round trip, not merely the
    // mutation's own optimistic cache write.
    expect(fetchStatuses).toContain("fetching");
  });

  it("rejects an unauthenticated vote with the real RLS-denial error", async () => {
    const setId = await createSet();

    const { result } = renderHook(() => useVoteMutation(), {
      wrapper: createQueryWrapper(),
    });

    act(() => {
      result.current.mutate({
        setId,
        voteType: 1,
        userId: SEEDED_USER_ID,
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // useVoteMutation wraps every failure in a generic Error, discarding the
    // real Supabase error — issue the identical upsert directly so this
    // test also asserts on the actual error Supabase/PostgREST returned and
    // proves it really is an RLS denial, not e.g. a network error.
    const { error } = await supabase
      .from("votes")
      .upsert(
        { user_id: SEEDED_USER_ID, set_id: setId, vote_type: 1 },
        { onConflict: "user_id,set_id" },
      );

    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501");
  });
});

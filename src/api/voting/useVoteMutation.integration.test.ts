import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { useVoteMutation } from "./useVoteMutation";
import { userVotesQuery } from "./useUserVotesQuery";
import { supabase } from "@/integrations/supabase/client";
import { createQueryWrapper } from "@/test/integration/harness";
import { signInAsTestUser } from "@/test/integration/fixtures/auth";
import { createSet } from "@/test/integration/fixtures/sets";
import { SEEDED_USER_ID } from "@/test/integration/fixtures/constants";

describe("useVoteMutation", () => {
  it("commits through a real invalidate -> refetch cycle, not just the mutation's optimistic write", async () => {
    const userId = await signInAsTestUser();
    const setId = await createSet();

    // Wraps the real queryFn so it still runs for real, but lets the test
    // count invocations: the mutation's onMutate writes the optimistic
    // value via setQueryData, which never re-runs the queryFn, so a second
    // call only happens if onSettled's invalidateQueries actually triggers
    // a real refetch.
    const votesQuery = userVotesQuery(userId);
    const queryFnSpy = vi.fn(votesQuery.queryFn);

    const { result } = renderHook(
      () => ({
        vote: useVoteMutation(),
        votes: useQuery({ ...votesQuery, queryFn: queryFnSpy }),
      }),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.votes.isSuccess).toBe(true));
    expect(queryFnSpy).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.vote.mutate({ setId, voteType: 2, userId });
    });

    await waitFor(() => expect(result.current.vote.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.votes.data?.[setId]).toBe(2));

    expect(queryFnSpy).toHaveBeenCalledTimes(2);
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

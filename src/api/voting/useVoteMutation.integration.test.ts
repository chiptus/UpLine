import { describe, expect, it } from "vitest";
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
  it("reflects a new vote in userVotesQuery after the mutation invalidates it", async () => {
    const { userId } = await signInAsTestUser();
    const setId = await createSet();

    const { result } = renderHook(
      () => ({
        vote: useVoteMutation(),
        votes: useQuery(userVotesQuery(userId)),
      }),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.votes.isSuccess).toBe(true));
    expect(result.current.votes.data?.[setId]).toBeUndefined();

    act(() => {
      result.current.vote.mutate({ setId, voteType: 2, userId });
    });

    await waitFor(() => expect(result.current.vote.isSuccess).toBe(true));

    // The query result — not the mutation's own response — is the thing
    // under test: it must reflect the real commit after invalidation.
    await waitFor(() => expect(result.current.votes.data?.[setId]).toBe(2));
  });

  it("rejects an unauthenticated insert with the real RLS-denial error", async () => {
    const setId = await createSet();

    const { error } = await supabase.from("votes").insert({
      user_id: SEEDED_USER_ID,
      set_id: setId,
      vote_type: 1,
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501");
  });
});

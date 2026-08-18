import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useVoteMutation } from "./useVoteMutation";
import { supabase } from "@/integrations/supabase/client";
import { createQueryWrapper, testSupabase } from "@/test/integration/harness";
import { signInAsTestUser } from "@/test/integration/fixtures/auth";
import { createSet } from "@/test/integration/fixtures/sets";
import { SEEDED_USER_ID } from "@/test/integration/fixtures/constants";

describe("useVoteMutation", () => {
  it("persists an authenticated vote through RLS", async () => {
    const userId = await signInAsTestUser();
    const setId = await createSet();

    const { result } = renderHook(() => useVoteMutation(), {
      wrapper: createQueryWrapper(),
    });

    act(() => {
      result.current.mutate({ setId, voteType: 2, userId });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Read back via the service-role client, bypassing the hook's own cache
    // entirely, so this proves the vote actually landed in the database
    // under RLS as this user — not just that the mutation call resolved.
    const { data, error } = await testSupabase
      .from("votes")
      .select("vote_type")
      .eq("user_id", userId)
      .eq("set_id", setId)
      .single();

    expect(error).toBeNull();
    expect(data?.vote_type).toBe(2);
  });

  it("rejects an unauthenticated vote with the real RLS-denial error", async () => {
    const setId = await createSet();

    // Skips the hook entirely: useVoteMutation wraps every failure in a
    // generic Error, discarding the real Supabase error, so the only way to
    // assert on the actual RLS-denial code is the same request the hook's
    // vote() sends, issued directly against the client.
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

import { describe, expect, it } from "vitest";
import { vote } from "./useVoteMutation";
import { supabase } from "@/integrations/supabase/client";
import { testSupabase } from "@/test/integration/harness";
import { signInAsTestUser } from "@/test/integration/fixtures/auth";
import { createSet } from "@/test/integration/fixtures/sets";
import { SEEDED_USER_ID } from "@/test/integration/fixtures/constants";

describe("vote", () => {
  it("persists an authenticated vote through RLS", async () => {
    const userId = await signInAsTestUser();
    const setId = await createSet();

    await vote({ setId, voteType: 2, userId });

    // Read back via the service-role client to prove the vote actually
    // landed in the database under RLS as this user, not just that the
    // call resolved without throwing.
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

    await expect(
      vote({ setId, voteType: 1, userId: SEEDED_USER_ID }),
    ).rejects.toThrow();

    // vote() wraps every failure into a generic Error, discarding the real
    // Supabase error — issue the identical request directly so this test
    // also proves the underlying failure really is an RLS denial, not
    // something else vote() would have equally swallowed.
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

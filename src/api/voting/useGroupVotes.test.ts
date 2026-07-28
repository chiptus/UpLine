import { beforeEach, describe, expect, it, vi } from "vitest";
import { groupVotesQuery } from "./useGroupVotes";

const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

beforeEach(() => {
  fromMock.mockReset();
});

function makeGroupMembersQuery(result: { data: unknown; error: unknown }) {
  return {
    select: () => ({
      eq: () => Promise.resolve(result),
    }),
  };
}

function makeVotesQuery(result: { data: unknown; error: unknown }) {
  return {
    select: () => ({
      eq: () => ({
        in: () => Promise.resolve(result),
      }),
    }),
  };
}

async function callFetchGroupVotes() {
  const { queryFn } = groupVotesQuery("set-1", "group-1");
  if (!queryFn) throw new Error("queryFn is not defined");
  // @ts-expect-error queryFn's context arg isn't needed for this call
  return queryFn({});
}

describe("fetchGroupVotes", () => {
  it("returns votes with embedded profile usernames in a single votes query", async () => {
    fromMock
      .mockReturnValueOnce(
        makeGroupMembersQuery({
          data: [{ user_id: "user-1" }, { user_id: "user-2" }],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        makeVotesQuery({
          data: [
            {
              vote_type: 2,
              user_id: "user-1",
              profiles: { username: "alice" },
            },
            { vote_type: 1, user_id: "user-2", profiles: null },
          ],
          error: null,
        }),
      );

    const votes = await callFetchGroupVotes();

    expect(fromMock).toHaveBeenCalledTimes(2);
    expect(fromMock).toHaveBeenNthCalledWith(1, "group_members");
    expect(fromMock).toHaveBeenNthCalledWith(2, "votes");
    expect(votes).toEqual([
      { vote_type: 2, user_id: "user-1", username: "alice" },
      { vote_type: 1, user_id: "user-2", username: null },
    ]);
  });

  it("returns an empty array when the group has no members", async () => {
    fromMock.mockReturnValueOnce(
      makeGroupMembersQuery({ data: [], error: null }),
    );

    const votes = await callFetchGroupVotes();

    expect(fromMock).toHaveBeenCalledTimes(1);
    expect(votes).toEqual([]);
  });

  it("propagates an error instead of silently returning username: null", async () => {
    fromMock
      .mockReturnValueOnce(
        makeGroupMembersQuery({ data: [{ user_id: "user-1" }], error: null }),
      )
      .mockReturnValueOnce(
        makeVotesQuery({
          data: null,
          error: { message: "profiles join failed" },
        }),
      );

    await expect(callFetchGroupVotes()).rejects.toThrow(
      "Failed to fetch group votes",
    );
  });
});

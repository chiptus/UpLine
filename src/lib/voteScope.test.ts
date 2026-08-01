import { describe, expect, it } from "vitest";
import { resolveVotesForScope } from "./voteScope";

const votes = [
  { user_id: "user-1", vote_type: 2 },
  { user_id: "user-2", vote_type: 1 },
  { user_id: "user-3", vote_type: -1 },
];

describe("resolveVotesForScope", () => {
  it("returns every vote for the everyone scope", () => {
    expect(
      resolveVotesForScope({
        votes,
        scope: "everyone",
        groupMemberIds: new Set(),
      }),
    ).toEqual(votes);
  });

  it("returns only the current user's votes for the me scope", () => {
    expect(
      resolveVotesForScope({
        votes,
        scope: "me",
        groupMemberIds: new Set(),
        currentUserId: "user-2",
      }),
    ).toEqual([votes[1]]);
  });

  it("returns votes from group members, including the current user when they are a member", () => {
    expect(
      resolveVotesForScope({
        votes,
        scope: "group",
        groupMemberIds: new Set(["user-1", "user-2"]),
        currentUserId: "user-1",
      }),
    ).toEqual([votes[0], votes[1]]);
  });

  it("excludes the current user's own vote from the group scope when they are not a member", () => {
    expect(
      resolveVotesForScope({
        votes,
        scope: "group",
        groupMemberIds: new Set(["user-2", "user-3"]),
        currentUserId: "user-1",
      }),
    ).toEqual([votes[1], votes[2]]);
  });

  it("returns an empty array for a set with no votes, regardless of scope", () => {
    expect(
      resolveVotesForScope({
        votes: [],
        scope: "group",
        groupMemberIds: new Set(["user-1"]),
      }),
    ).toEqual([]);
  });

  it("returns an empty array when every vote belongs to a user outside the group", () => {
    expect(
      resolveVotesForScope({
        votes,
        scope: "group",
        groupMemberIds: new Set(["user-4", "user-5"]),
      }),
    ).toEqual([]);
  });
});

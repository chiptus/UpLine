import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useExplorableSets } from "./useExplorableSets";
import { useSetsByEditionQuery } from "@/api/sets/useSetsByEdition";
import type { FestivalSet } from "@/api/sets/types";

vi.mock("@/api/sets/useSetsByEdition", () => ({
  useSetsByEditionQuery: vi.fn(),
}));

const mockUseSetsByEditionQuery = vi.mocked(useSetsByEditionQuery);

describe("useExplorableSets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("excludes sets already voted before the queue loads", () => {
    mockSetsQuery([makeSet("a"), makeSet("b"), makeSet("c")]);

    const { result } = renderHook(() =>
      useExplorableSets({
        editionId: "edition-1",
        userVotes: { b: 2 },
        votesReady: true,
      }),
    );

    expect(result.current.data.map((s) => s.id).sort()).toEqual(["a", "c"]);
  });

  it("keeps the currently displayed set in the queue after it is voted on", () => {
    mockSetsQuery([makeSet("a"), makeSet("b"), makeSet("c")]);

    const { result, rerender } = renderHook(
      (props: { userVotes: Record<string, number> }) =>
        useExplorableSets({
          editionId: "edition-1",
          userVotes: props.userVotes,
          votesReady: true,
        }),
      { initialProps: { userVotes: {} } },
    );

    const initialQueue = result.current.data;
    expect(initialQueue.map((s) => s.id).sort()).toEqual(["a", "b", "c"]);

    // Casting a vote on "a" updates userVotes, as the real vote mutation does.
    rerender({ userVotes: { a: 2 } });

    expect(result.current.data).toBe(initialQueue);
  });

  it("does not lock in the queue until votes have finished loading", () => {
    mockSetsQuery([makeSet("a"), makeSet("b")]);

    const { result, rerender } = renderHook(
      (props: { userVotes: Record<string, number>; votesReady: boolean }) =>
        useExplorableSets({
          editionId: "edition-1",
          userVotes: props.userVotes,
          votesReady: props.votesReady,
        }),
      { initialProps: { userVotes: {}, votesReady: false } },
    );

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(true);

    // Votes resolve, revealing that "b" was already voted on in a past session.
    rerender({ userVotes: { b: 1 }, votesReady: true });

    expect(result.current.data.map((s) => s.id)).toEqual(["a"]);
    expect(result.current.isLoading).toBe(false);
  });

  it("rebuilds the queue when the edition changes", () => {
    mockSetsQuery([makeSet("a"), makeSet("b")]);

    const { result, rerender } = renderHook(
      (props: { editionId: string }) =>
        useExplorableSets({
          editionId: props.editionId,
          userVotes: {},
          votesReady: true,
        }),
      { initialProps: { editionId: "edition-1" } },
    );

    expect(result.current.data.map((s) => s.id).sort()).toEqual(["a", "b"]);

    mockSetsQuery([makeSet("x")]);
    rerender({ editionId: "edition-2" });

    expect(result.current.data.map((s) => s.id)).toEqual(["x"]);
  });

  it("rebuilds the queue once when a user logs in mid-session", () => {
    mockSetsQuery([makeSet("a"), makeSet("b"), makeSet("c")]);

    const { result, rerender } = renderHook(
      (props: {
        userId: string | undefined;
        userVotes: Record<string, number>;
        votesReady: boolean;
      }) =>
        useExplorableSets({
          editionId: "edition-1",
          userId: props.userId,
          userVotes: props.userVotes,
          votesReady: props.votesReady,
        }),
      {
        initialProps: {
          userId: undefined as string | undefined,
          userVotes: {},
          votesReady: true,
        },
      },
    );

    // Browsing anonymously: nothing to exclude yet.
    expect(result.current.data.map((s) => s.id).sort()).toEqual([
      "a",
      "b",
      "c",
    ]);

    // User signs in (e.g. via the vote-triggered auth dialog); their votes
    // haven't loaded yet.
    rerender({ userId: "user-1", userVotes: {}, votesReady: false });

    expect(result.current.isLoading).toBe(true);

    // Their votes load, revealing "b" was already voted on in a past session.
    rerender({ userId: "user-1", userVotes: { b: 2 }, votesReady: true });

    expect(result.current.data.map((s) => s.id).sort()).toEqual(["a", "c"]);
  });

  it("computes votedCount and nonExplorableCount live even though the queue is frozen", () => {
    mockSetsQuery([makeSet("a"), makeSet("b"), makeSet("c")]);

    const { result, rerender } = renderHook(
      (props: { userVotes: Record<string, number> }) =>
        useExplorableSets({
          editionId: "edition-1",
          userVotes: props.userVotes,
          votesReady: true,
        }),
      { initialProps: { userVotes: {} } },
    );

    expect(result.current.votedCount).toBe(0);

    rerender({ userVotes: { a: 2 } });

    expect(result.current.votedCount).toBe(1);
    expect(result.current.data.map((s) => s.id).sort()).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});

function makeSet(id: string): FestivalSet {
  return {
    id,
    name: `Set ${id}`,
    artists: [{ soundcloud_url: `https://soundcloud.com/${id}` }],
  } as unknown as FestivalSet;
}

function mockSetsQuery(data: FestivalSet[] | undefined, isLoading = false) {
  mockUseSetsByEditionQuery.mockReturnValue({
    data,
    isLoading,
    error: null,
  } as unknown as ReturnType<typeof useSetsByEditionQuery>);
}

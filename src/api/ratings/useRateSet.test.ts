import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useRateSet } from "./useRateSet";
import { userRatingsKeys } from "./types";

const upsertMock = vi.fn();
const deleteMock = vi.fn();
const eqMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: upsertMock,
      delete: deleteMock,
    })),
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function wrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useRateSet", () => {
  beforeEach(() => {
    upsertMock.mockReset().mockResolvedValue({ error: null });
    deleteMock.mockReset().mockReturnValue({
      eq: eqMock.mockReturnThis(),
    });
    eqMock.mockReset().mockReturnThis();
  });

  it("inserts a rating via upsert on set_ratings", async () => {
    const queryClient = new QueryClient();
    const { result } = renderHook(() => useRateSet(), {
      wrapper: wrapper(queryClient),
    });

    result.current.mutate({
      setId: "set-1",
      rating: 2,
      userId: "user-1",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(upsertMock).toHaveBeenCalledWith(
      { user_id: "user-1", set_id: "set-1", rating: 2 },
      { onConflict: "user_id,set_id" },
    );
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("removes the rating when re-selecting the same value", async () => {
    const queryClient = new QueryClient();
    // deleteMock returns object with eq that itself returns a promise-like
    deleteMock.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const { result } = renderHook(() => useRateSet(), {
      wrapper: wrapper(queryClient),
    });

    result.current.mutate({
      setId: "set-1",
      rating: 2,
      userId: "user-1",
      existingRating: 2,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteMock).toHaveBeenCalled();
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("optimistically updates cached ratings before the mutation settles", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(userRatingsKeys.user("user-1"), {});

    const deferred: { resolve?: (value: { error: null }) => void } = {};
    upsertMock.mockReturnValue(
      new Promise((resolve) => {
        deferred.resolve = resolve;
      }),
    );

    const { result } = renderHook(() => useRateSet(), {
      wrapper: wrapper(queryClient),
    });

    result.current.mutate({
      setId: "set-1",
      rating: 1,
      userId: "user-1",
    });

    await waitFor(() =>
      expect(
        queryClient.getQueryData<Record<string, number>>(
          userRatingsKeys.user("user-1"),
        ),
      ).toEqual({ "set-1": 1 }),
    );

    deferred.resolve?.({ error: null });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

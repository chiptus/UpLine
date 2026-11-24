import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCheckableSlug } from "./useCheckableSlug";

describe("useCheckableSlug", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("waits for typing to settle before returning a changed valid slug", () => {
    const { result, rerender } = renderHook(
      ({ slug }) => useCheckableSlug(slug, "old"),
      { initialProps: { slug: "old" } },
    );
    expect(result.current).toBeNull();

    rerender({ slug: "new-slug" });
    expect(result.current).toBeNull();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("new-slug");
  });

  it("never returns a malformed slug", () => {
    const { result } = renderHook(() => useCheckableSlug("Not A Slug", "old"));
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBeNull();
  });
});

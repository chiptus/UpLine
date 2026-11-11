import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useElementHeight } from "./useElementHeight";

describe("useElementHeight", () => {
  let trigger: (blockSize: number) => void;

  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: (entries: Partial<ResizeObserverEntry>[]) => void) {
          trigger = (blockSize) =>
            cb([{ borderBoxSize: [{ blockSize, inlineSize: 0 }] }]);
        }
        observe() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports the initial height when the element attaches", () => {
    const { result } = renderHook(() => useElementHeight());

    act(() => result.current[0](elementWithHeight(63)));

    expect(result.current[1]).toBe(63);
  });

  it("updates when the observed element resizes", () => {
    const { result } = renderHook(() => useElementHeight());
    act(() => result.current[0](elementWithHeight(63)));

    act(() => trigger(95));

    expect(result.current[1]).toBe(95);
  });

  it("resets to 0 when the element unmounts", () => {
    const { result } = renderHook(() => useElementHeight());
    act(() => result.current[0](elementWithHeight(63)));

    act(() => result.current[0](null));

    expect(result.current[1]).toBe(0);
  });
});

function elementWithHeight(height: number) {
  const el = document.createElement("div");
  el.getBoundingClientRect = () => ({ height }) as DOMRect;
  return el;
}

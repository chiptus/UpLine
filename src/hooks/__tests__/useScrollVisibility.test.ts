import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useScrollVisibility } from "../useScrollVisibility";
import { RefObject } from "react";

describe("useScrollVisibility", () => {
  let observeCallback: IntersectionObserverCallback | null = null;
  let observeMock: ReturnType<typeof vi.fn>;
  let unobserveMock: ReturnType<typeof vi.fn>;
  let disconnectMock: ReturnType<typeof vi.fn>;
  let constructorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    observeMock = vi.fn();
    unobserveMock = vi.fn();
    disconnectMock = vi.fn();

    constructorSpy = vi.fn((callback: IntersectionObserverCallback) => {
      observeCallback = callback;
      return {
        observe: observeMock,
        unobserve: unobserveMock,
        disconnect: disconnectMock,
        root: null,
        rootMargin: "",
        thresholds: [],
        takeRecords: vi.fn(),
      };
    });

    global.IntersectionObserver = constructorSpy as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
    observeCallback = null;
  });

  it("returns true by default", () => {
    const ref: RefObject<HTMLDivElement> = { current: document.createElement("div") };
    const { result } = renderHook(() => useScrollVisibility(ref));
    expect(result.current).toBe(true);
  });

  it("observes element when ref has current", () => {
    const element = document.createElement("div");
    const ref: RefObject<HTMLDivElement> = { current: element };
    renderHook(() => useScrollVisibility(ref));

    expect(observeMock).toHaveBeenCalledWith(element);
  });

  it("does not observe when ref.current is null", () => {
    const ref: RefObject<HTMLDivElement> = { current: null };
    renderHook(() => useScrollVisibility(ref));

    expect(observeMock).not.toHaveBeenCalled();
  });

  it("updates visibility when element becomes visible", async () => {
    const element = document.createElement("div");
    const ref: RefObject<HTMLDivElement> = { current: element };
    const { result } = renderHook(() => useScrollVisibility(ref));

    const entry = { isIntersecting: true } as IntersectionObserverEntry;
    if (observeCallback) {
      observeCallback([entry], {} as IntersectionObserver);
    }

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("updates visibility when element becomes hidden", async () => {
    const element = document.createElement("div");
    const ref: RefObject<HTMLDivElement> = { current: element };
    const { result } = renderHook(() => useScrollVisibility(ref));

    const entry = { isIntersecting: false } as IntersectionObserverEntry;
    if (observeCallback) {
      observeCallback([entry], {} as IntersectionObserver);
    }

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("uses custom threshold option", () => {
    const element = document.createElement("div");
    const ref: RefObject<HTMLDivElement> = { current: element };
    renderHook(() => useScrollVisibility(ref, { threshold: 0.5 }));

    expect(constructorSpy).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ threshold: 0.5 }),
    );
  });

  it("uses custom rootMargin option", () => {
    const element = document.createElement("div");
    const ref: RefObject<HTMLDivElement> = { current: element };
    renderHook(() => useScrollVisibility(ref, { rootMargin: "10px" }));

    expect(constructorSpy).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ rootMargin: "10px" }),
    );
  });

  it("uses default threshold of 0", () => {
    const element = document.createElement("div");
    const ref: RefObject<HTMLDivElement> = { current: element };
    renderHook(() => useScrollVisibility(ref));

    expect(constructorSpy).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ threshold: 0 }),
    );
  });

  it("uses default rootMargin of 0px", () => {
    const element = document.createElement("div");
    const ref: RefObject<HTMLDivElement> = { current: element };
    renderHook(() => useScrollVisibility(ref));

    expect(constructorSpy).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ rootMargin: "0px" }),
    );
  });

  it("unobserves element on unmount", () => {
    const element = document.createElement("div");
    const ref: RefObject<HTMLDivElement> = { current: element };
    const { unmount } = renderHook(() => useScrollVisibility(ref));

    unmount();

    expect(unobserveMock).toHaveBeenCalledWith(element);
  });

  it("disconnects observer on unmount", () => {
    const element = document.createElement("div");
    const ref: RefObject<HTMLDivElement> = { current: element };
    const { unmount } = renderHook(() => useScrollVisibility(ref));

    unmount();

    expect(disconnectMock).toHaveBeenCalled();
  });

  it("handles multiple visibility changes", async () => {
    const element = document.createElement("div");
    const ref: RefObject<HTMLDivElement> = { current: element };
    const { result } = renderHook(() => useScrollVisibility(ref));

    if (observeCallback) {
      observeCallback(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    }

    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    if (observeCallback) {
      observeCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    }

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("recreates observer when options change", () => {
    const element = document.createElement("div");
    const ref: RefObject<HTMLDivElement> = { current: element };
    const { rerender } = renderHook(
      ({ threshold }) => useScrollVisibility(ref, { threshold }),
      { initialProps: { threshold: 0 } },
    );

    const firstObserver = global.IntersectionObserver;

    rerender({ threshold: 0.5 });

    expect(unobserveMock).toHaveBeenCalled();
    expect(disconnectMock).toHaveBeenCalled();
  });

  it("does not throw when element is null on unmount", () => {
    const ref: RefObject<HTMLDivElement> = { current: null };
    const { unmount } = renderHook(() => useScrollVisibility(ref));

    expect(() => unmount()).not.toThrow();
  });
});

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useOnlineStatus } from "../useOnlineStatus";

describe("useOnlineStatus", () => {
  let onlineListener: ((event: Event) => void) | null = null;
  let offlineListener: ((event: Event) => void) | null = null;

  beforeEach(() => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      configurable: true,
      value: true,
    });

    vi.spyOn(window, "addEventListener").mockImplementation((event, handler) => {
      if (event === "online") {
        onlineListener = handler as (event: Event) => void;
      } else if (event === "offline") {
        offlineListener = handler as (event: Event) => void;
      }
    });

    vi.spyOn(window, "removeEventListener").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    onlineListener = null;
    offlineListener = null;
  });

  it("returns true when navigator.onLine is true", () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      configurable: true,
      value: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it("returns false when navigator.onLine is false", () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it("sets up online event listener on mount", () => {
    renderHook(() => useOnlineStatus());
    expect(window.addEventListener).toHaveBeenCalledWith(
      "online",
      expect.any(Function),
    );
  });

  it("sets up offline event listener on mount", () => {
    renderHook(() => useOnlineStatus());
    expect(window.addEventListener).toHaveBeenCalledWith(
      "offline",
      expect.any(Function),
    );
  });

  it("removes event listeners on unmount", () => {
    const { unmount } = renderHook(() => useOnlineStatus());
    unmount();
    expect(window.removeEventListener).toHaveBeenCalledWith(
      "online",
      expect.any(Function),
    );
    expect(window.removeEventListener).toHaveBeenCalledWith(
      "offline",
      expect.any(Function),
    );
  });

  it("updates to true when online event is fired", async () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);

    act(() => {
      if (onlineListener) {
        onlineListener(new Event("online"));
      }
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("updates to false when offline event is fired", async () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      configurable: true,
      value: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      if (offlineListener) {
        offlineListener(new Event("offline"));
      }
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("handles multiple online/offline transitions", async () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      if (offlineListener) {
        offlineListener(new Event("offline"));
      }
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    act(() => {
      if (onlineListener) {
        onlineListener(new Event("online"));
      }
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    act(() => {
      if (offlineListener) {
        offlineListener(new Event("offline"));
      }
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("maintains state across re-renders", async () => {
    const { result, rerender } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    rerender();
    expect(result.current).toBe(true);

    act(() => {
      if (offlineListener) {
        offlineListener(new Event("offline"));
      }
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    rerender();
    expect(result.current).toBe(false);
  });

  it("cleans up listeners on unmount without errors", () => {
    const { unmount } = renderHook(() => useOnlineStatus());
    expect(() => unmount()).not.toThrow();
  });
});

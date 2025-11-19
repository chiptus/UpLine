import { describe, expect, it, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToast, toast } from "../use-toast";

describe("useToast", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with empty toasts array", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it("adds a toast when toast is called", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "Test Toast" });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe("Test Toast");
  });

  it("returns toast with id, dismiss, and update methods", () => {
    const { result } = renderHook(() => useToast());

    let toastResult: any;
    act(() => {
      toastResult = result.current.toast({ title: "Test" });
    });

    expect(toastResult).toHaveProperty("id");
    expect(toastResult).toHaveProperty("dismiss");
    expect(toastResult).toHaveProperty("update");
    expect(typeof toastResult.id).toBe("string");
    expect(typeof toastResult.dismiss).toBe("function");
    expect(typeof toastResult.update).toBe("function");
  });

  it("generates unique IDs for toasts", () => {
    const { result } = renderHook(() => useToast());

    let toast1: any, toast2: any;
    act(() => {
      toast1 = result.current.toast({ title: "Toast 1" });
      toast2 = result.current.toast({ title: "Toast 2" });
    });

    expect(toast1.id).not.toBe(toast2.id);
  });

  it("limits toasts to TOAST_LIMIT (1)", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "Toast 1" });
      result.current.toast({ title: "Toast 2" });
      result.current.toast({ title: "Toast 3" });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe("Toast 3");
  });

  it("sets toast as open by default", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "Test" });
    });

    expect(result.current.toasts[0].open).toBe(true);
  });

  it("dismisses a toast by ID", () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      const toastResult = result.current.toast({ title: "Test" });
      toastId = toastResult.id;
    });

    act(() => {
      result.current.dismiss(toastId);
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it("dismisses all toasts when no ID provided", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "Toast 1" });
    });

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it("updates toast with new props", () => {
    const { result } = renderHook(() => useToast());

    let toastResult: any;
    act(() => {
      toastResult = result.current.toast({ title: "Original" });
    });

    act(() => {
      toastResult.update({ title: "Updated" });
    });

    expect(result.current.toasts[0].title).toBe("Updated");
  });

  it("toast dismiss method works", () => {
    const { result } = renderHook(() => useToast());

    let toastResult: any;
    act(() => {
      toastResult = result.current.toast({ title: "Test" });
    });

    act(() => {
      toastResult.dismiss();
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it("handles description prop", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: "Title",
        description: "Description text",
      });
    });

    expect(result.current.toasts[0].description).toBe("Description text");
  });

  it("handles variant prop", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: "Test",
        variant: "destructive",
      });
    });

    expect(result.current.toasts[0].variant).toBe("destructive");
  });

  it("can use toast function directly without hook", () => {
    const result = toast({ title: "Direct Toast" });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("dismiss");
    expect(result).toHaveProperty("update");
  });

  it("maintains toast state across multiple hook instances", () => {
    const { result: result1 } = renderHook(() => useToast());
    const { result: result2 } = renderHook(() => useToast());

    act(() => {
      result1.current.toast({ title: "Shared Toast" });
    });

    expect(result1.current.toasts).toHaveLength(1);
    expect(result2.current.toasts).toHaveLength(1);
    expect(result1.current.toasts[0].id).toBe(result2.current.toasts[0].id);
  });

  it("handles onOpenChange callback", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "Test" });
    });

    const toastItem = result.current.toasts[0];
    expect(toastItem.onOpenChange).toBeDefined();
    expect(typeof toastItem.onOpenChange).toBe("function");

    act(() => {
      toastItem.onOpenChange(false);
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it("increments ID counter correctly", () => {
    const { result } = renderHook(() => useToast());

    let id1: string, id2: string, id3: string;
    act(() => {
      const t1 = result.current.toast({ title: "1" });
      const t2 = result.current.toast({ title: "2" });
      const t3 = result.current.toast({ title: "3" });
      id1 = t1.id;
      id2 = t2.id;
      id3 = t3.id;
    });

    expect(parseInt(id1)).toBeLessThan(parseInt(id2));
    expect(parseInt(id2)).toBeLessThan(parseInt(id3));
  });

  it("keeps most recent toast when limit is reached", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "First" });
      result.current.toast({ title: "Second" });
    });

    expect(result.current.toasts[0].title).toBe("Second");
  });
});

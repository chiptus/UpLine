import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { z } from "zod";
import { useLocalStorageState } from "./useLocalStorageState";

const schema = z.object({
  count: z.number(),
});

describe("useLocalStorageState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with the default value when no stored data exists", () => {
    const { result } = renderHook(() =>
      useLocalStorageState("test-key", schema, { count: 0 }),
    );

    expect(result.current[0]).toEqual({ count: 0 });
  });

  it("initializes from localStorage when valid data is stored", () => {
    localStorage.setItem("test-key", JSON.stringify({ count: 5 }));

    const { result } = renderHook(() =>
      useLocalStorageState("test-key", schema, { count: 0 }),
    );

    expect(result.current[0]).toEqual({ count: 5 });
  });

  it("falls back to the default value when stored data fails schema validation", () => {
    localStorage.setItem("test-key", JSON.stringify({ count: "not-a-number" }));

    const { result } = renderHook(() =>
      useLocalStorageState("test-key", schema, { count: 0 }),
    );

    expect(result.current[0]).toEqual({ count: 0 });
  });

  it("falls back to the default value when stored JSON is malformed", () => {
    localStorage.setItem("test-key", "not json");

    const { result } = renderHook(() =>
      useLocalStorageState("test-key", schema, { count: 0 }),
    );

    expect(result.current[0]).toEqual({ count: 0 });
  });

  it("updates state and persists to localStorage", () => {
    const { result } = renderHook(() =>
      useLocalStorageState("test-key", schema, { count: 0 }),
    );

    act(() => {
      result.current[1]({ count: 42 });
    });

    expect(result.current[0]).toEqual({ count: 42 });
    expect(JSON.parse(localStorage.getItem("test-key")!)).toEqual({
      count: 42,
    });
  });

  it("supports a lazy default value", () => {
    const { result } = renderHook(() =>
      useLocalStorageState("test-key", schema, () => ({ count: 7 })),
    );

    expect(result.current[0]).toEqual({ count: 7 });
  });
});

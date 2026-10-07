import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSlugField } from "./useSlugField";

describe("useSlugField", () => {
  it("derives the slug from the name while the slug is untouched", () => {
    const { result } = renderHook(() => useSlugField());

    act(() => result.current.changeName("Summer Fest"));
    expect(result.current.slug).toBe("summer-fest");

    act(() => result.current.changeName("Summer Fest 2"));
    expect(result.current.slug).toBe("summer-fest-2");
  });

  it("stops deriving once the slug is edited directly", () => {
    const { result } = renderHook(() => useSlugField());

    act(() => result.current.changeName("Summer Fest"));
    act(() => result.current.changeSlug("custom"));
    act(() => result.current.changeName("Winter Fest"));

    expect(result.current.slug).toBe("custom");
    expect(result.current.name).toBe("Winter Fest");
  });

  it("sanitizes typed slugs", () => {
    const { result } = renderHook(() => useSlugField());

    act(() => result.current.changeSlug("My Slug!"));

    expect(result.current.slug).toBe("my-slug");
    expect(result.current.slugError).toBe("");
  });

  it("resets name and slug, clearing any error", () => {
    const { result } = renderHook(() => useSlugField());

    act(() => result.current.changeName("A"));
    act(() => result.current.reset({ name: "B", slug: "b-slug" }));

    expect(result.current.name).toBe("B");
    expect(result.current.slug).toBe("b-slug");
    expect(result.current.slugError).toBe("");
  });

  it("starts empty when reset without values", () => {
    const { result } = renderHook(() => useSlugField());

    act(() => result.current.changeName("A"));
    act(() => result.current.reset());

    expect(result.current.name).toBe("");
    expect(result.current.slug).toBe("");
  });
});

import { describe, expect, it } from "vitest";
import { cn } from "../utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("handles conditional classes", () => {
    expect(cn("class1", false && "class2", "class3")).toBe("class1 class3");
    expect(cn("class1", true && "class2", "class3")).toBe("class1 class2 class3");
  });

  it("handles undefined and null", () => {
    expect(cn("class1", undefined, "class2")).toBe("class1 class2");
    expect(cn("class1", null, "class2")).toBe("class1 class2");
  });

  it("merges Tailwind conflicting classes correctly", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles array of classes", () => {
    expect(cn(["class1", "class2"])).toBe("class1 class2");
  });

  it("handles objects with boolean values", () => {
    expect(cn({ class1: true, class2: false, class3: true })).toBe(
      "class1 class3",
    );
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
  });

  it("combines multiple input types", () => {
    expect(
      cn("base", { active: true, disabled: false }, ["extra1", "extra2"]),
    ).toBe("base active extra1 extra2");
  });

  it("handles duplicate non-Tailwind classes", () => {
    expect(cn("class1", "class1", "class2")).toBe("class1 class1 class2");
  });

  it("handles complex Tailwind class merging", () => {
    expect(cn("p-4 text-sm", "p-2 text-lg")).toBe("p-2 text-lg");
  });

  it("preserves non-conflicting Tailwind classes", () => {
    expect(cn("p-4 m-2", "text-sm")).toBe("p-4 m-2 text-sm");
  });

  it("handles whitespace in class strings", () => {
    expect(cn("  class1  ", "  class2  ")).toBe("class1 class2");
  });
});

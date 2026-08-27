import { describe, expect, it } from "vitest";
import { generateSetName } from "./generateSetName";

describe("generateSetName", () => {
  it("generates from artist names for music sets", () => {
    expect(generateSetName(["Shpongle"], "music")).toBe("Shpongle");
    expect(generateSetName(["A", "B"], "music")).toBe("A vs B");
    expect(generateSetName(["A", "B", "C"], "music")).toBe("A + 2 more");
  });

  it("returns empty for music sets with no artists", () => {
    expect(generateSetName([], "music")).toBe("");
  });

  it("never generates for non-music types", () => {
    expect(generateSetName(["Shpongle"], "workshop")).toBe("");
    expect(generateSetName(["A", "B"], "performance")).toBe("");
    expect(generateSetName(["A", "B", "C"], "other")).toBe("");
  });

  it("never generates for untyped sets", () => {
    expect(generateSetName(["Shpongle"], null)).toBe("");
  });
});

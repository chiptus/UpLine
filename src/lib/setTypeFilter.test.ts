import { describe, expect, it } from "vitest";
import { matchesSetTypeFilter } from "./setTypeFilter";

describe("matchesSetTypeFilter", () => {
  it("matches everything when no types are selected", () => {
    expect(matchesSetTypeFilter("music", [])).toBe(true);
    expect(matchesSetTypeFilter(null, [])).toBe(true);
  });

  it("matches sets whose type is selected", () => {
    expect(matchesSetTypeFilter("workshop", ["workshop"])).toBe(true);
    expect(matchesSetTypeFilter("music", ["workshop"])).toBe(false);
    expect(matchesSetTypeFilter("music", ["workshop", "music"])).toBe(true);
  });

  it("matches untyped sets under the other chip", () => {
    expect(matchesSetTypeFilter(null, ["other"])).toBe(true);
    expect(matchesSetTypeFilter(null, ["workshop"])).toBe(false);
  });
});

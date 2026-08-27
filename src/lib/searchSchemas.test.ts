import { describe, it, expect } from "vitest";
import {
  filterSortSearchSchema,
  filterSortSearchDefaults,
} from "./searchSchemas";

describe("filterSortSearchSchema types", () => {
  it("drops unknown values and de-dupes", () => {
    const result = filterSortSearchSchema.parse({
      ...filterSortSearchDefaults,
      types: ["workshop", "bogus", "workshop"],
    });
    expect(result.types).toEqual(["workshop"]);
  });

  it("keeps all known set types", () => {
    const result = filterSortSearchSchema.parse({
      ...filterSortSearchDefaults,
      types: ["music", "workshop", "performance", "other"],
    });
    expect(result.types).toEqual(["music", "workshop", "performance", "other"]);
  });

  it("falls back to an empty array for non-array input", () => {
    const result = filterSortSearchSchema.parse({
      ...filterSortSearchDefaults,
      types: "workshop",
    });
    expect(result.types).toEqual([]);
  });

  it("defaults to an empty array when missing", () => {
    const result = filterSortSearchSchema.parse(filterSortSearchDefaults);
    expect(result.types).toEqual([]);
  });
});

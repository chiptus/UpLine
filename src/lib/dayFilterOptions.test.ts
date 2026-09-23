import { describe, expect, it } from "vitest";
import { buildDayFilterOptions } from "./dayFilterOptions";

describe("buildDayFilterOptions", () => {
  it("returns one option per calendar day the edition spans", () => {
    const options = buildDayFilterOptions("2025-07-12", "2025-07-14");

    expect(options).toEqual([
      { value: "2025-07-12", label: "Saturday" },
      { value: "2025-07-13", label: "Sunday" },
      { value: "2025-07-14", label: "Monday" },
    ]);
  });

  it("returns no options when either date is missing", () => {
    expect(buildDayFilterOptions(undefined, "2025-07-14")).toEqual([]);
    expect(buildDayFilterOptions("2025-07-12", undefined)).toEqual([]);
  });

  it("returns no options for invalid dates", () => {
    expect(buildDayFilterOptions("not-a-date", "2025-07-14")).toEqual([]);
  });

  it("with dayStartHour 0 (or omitted) is unaffected - the default renders identically", () => {
    const withDefault = buildDayFilterOptions("2025-07-12", "2025-07-14");
    const withExplicitZero = buildDayFilterOptions(
      "2025-07-12",
      "2025-07-14",
      0,
    );

    expect(withExplicitZero).toEqual(withDefault);
  });

  it("adds a leading day before start_date when dayStartHour is set", () => {
    const options = buildDayFilterOptions("2025-07-12", "2025-07-14", 6);

    expect(options[0]).toEqual({ value: "2025-07-11", label: "Friday" });
    expect(options).toHaveLength(4);
  });
});

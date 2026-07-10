import { describe, expect, it } from "vitest";
import { getDefaultTab } from "./defaultTab";

describe("getDefaultTab", () => {
  it("defaults to the primary (sets) tab in Pre-Schedule", () => {
    expect(getDefaultTab("pre-schedule")).toBe("sets");
  });

  it("defaults to the primary (sets) tab in Planning", () => {
    expect(getDefaultTab("planning")).toBe("sets");
  });

  it("defaults to the schedule tab in Live", () => {
    expect(getDefaultTab("live")).toBe("schedule");
  });

  it("defaults to the primary (sets) tab in Post-Festival", () => {
    expect(getDefaultTab("post-festival")).toBe("sets");
  });
});

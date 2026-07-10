import { describe, expect, it } from "vitest";
import { getDefaultTab } from "./defaultTab";

describe("getDefaultTab", () => {
  it("defaults to the primary (sets) tab in Pre-Schedule", () => {
    expect(getDefaultTab("pre-schedule")).toBe("sets");
  });

  it("defaults to the primary (sets) tab in Planning", () => {
    expect(getDefaultTab("planning")).toBe("sets");
  });

  it("has a default tab defined for every phase", () => {
    expect(getDefaultTab("live")).toBe("sets");
    expect(getDefaultTab("post-festival")).toBe("sets");
  });
});

import { describe, expect, it } from "vitest";
import {
  canShowDay,
  canShowStage,
  canShowTime,
  isAtLeast,
  maskSetForReveal,
} from "./scheduleReveal";

const baseSet = {
  id: "s1",
  time_start: "2025-08-01T18:00:00",
  time_end: "2025-08-01T19:00:00",
  stage_id: "stage-1",
  name: "A set",
};

describe("isAtLeast", () => {
  it("compares levels in declared order", () => {
    expect(isAtLeast("draft", "draft")).toBe(true);
    expect(isAtLeast("draft", "days")).toBe(false);
    expect(isAtLeast("days", "draft")).toBe(true);
    expect(isAtLeast("stages", "days")).toBe(true);
    expect(isAtLeast("full", "stages")).toBe(true);
    expect(isAtLeast("stages", "full")).toBe(false);
  });
});

describe("canShow predicates", () => {
  it("draft hides everything", () => {
    expect(canShowDay("draft")).toBe(false);
    expect(canShowStage("draft")).toBe(false);
    expect(canShowTime("draft")).toBe(false);
  });

  it("days exposes day only", () => {
    expect(canShowDay("days")).toBe(true);
    expect(canShowStage("days")).toBe(false);
    expect(canShowTime("days")).toBe(false);
  });

  it("stages exposes day + stage, hides time", () => {
    expect(canShowDay("stages")).toBe(true);
    expect(canShowStage("stages")).toBe(true);
    expect(canShowTime("stages")).toBe(false);
  });

  it("full exposes everything", () => {
    expect(canShowDay("full")).toBe(true);
    expect(canShowStage("full")).toBe(true);
    expect(canShowTime("full")).toBe(true);
  });
});

describe("maskSetForReveal", () => {
  it("returns the set untouched at full", () => {
    expect(maskSetForReveal(baseSet, "full")).toEqual(baseSet);
  });

  it("nulls everything at draft", () => {
    const masked = maskSetForReveal(baseSet, "draft");
    expect(masked.time_start).toBeNull();
    expect(masked.time_end).toBeNull();
    expect(masked.stage_id).toBeNull();
    expect(masked.name).toBe(baseSet.name);
  });

  it("keeps date portion of time_start, nulls time_end and stage_id at days", () => {
    const masked = maskSetForReveal(baseSet, "days");
    expect(masked.time_start).toBe("2025-08-01T00:00:00");
    expect(masked.time_end).toBeNull();
    expect(masked.stage_id).toBeNull();
  });

  it("keeps date portion of time_start and stage_id, nulls time_end at stages", () => {
    const masked = maskSetForReveal(baseSet, "stages");
    expect(masked.time_start).toBe("2025-08-01T00:00:00");
    expect(masked.time_end).toBeNull();
    expect(masked.stage_id).toBe(baseSet.stage_id);
  });

  it("does not mutate the original set", () => {
    const original = { ...baseSet };
    maskSetForReveal(baseSet, "draft");
    expect(baseSet).toEqual(original);
  });
});

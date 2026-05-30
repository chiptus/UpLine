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
  it("admins always see everything", () => {
    expect(canShowDay("draft", true)).toBe(true);
    expect(canShowStage("draft", true)).toBe(true);
    expect(canShowTime("draft", true)).toBe(true);
  });

  it("draft hides everything for non-admins", () => {
    expect(canShowDay("draft", false)).toBe(false);
    expect(canShowStage("draft", false)).toBe(false);
    expect(canShowTime("draft", false)).toBe(false);
  });

  it("days exposes day only", () => {
    expect(canShowDay("days", false)).toBe(true);
    expect(canShowStage("days", false)).toBe(false);
    expect(canShowTime("days", false)).toBe(false);
  });

  it("stages exposes day + stage, hides time", () => {
    expect(canShowDay("stages", false)).toBe(true);
    expect(canShowStage("stages", false)).toBe(true);
    expect(canShowTime("stages", false)).toBe(false);
  });

  it("full exposes everything", () => {
    expect(canShowDay("full", false)).toBe(true);
    expect(canShowStage("full", false)).toBe(true);
    expect(canShowTime("full", false)).toBe(true);
  });
});

describe("maskSetForReveal", () => {
  it("returns the set untouched for admins regardless of level", () => {
    expect(maskSetForReveal(baseSet, "draft", true)).toEqual(baseSet);
    expect(maskSetForReveal(baseSet, "days", true)).toEqual(baseSet);
  });

  it("returns the set untouched at full for non-admins", () => {
    expect(maskSetForReveal(baseSet, "full", false)).toEqual(baseSet);
  });

  it("nulls everything at draft for non-admins", () => {
    const masked = maskSetForReveal(baseSet, "draft", false);
    expect(masked.time_start).toBeNull();
    expect(masked.time_end).toBeNull();
    expect(masked.stage_id).toBeNull();
    expect(masked.name).toBe(baseSet.name);
  });

  it("keeps time_start, nulls time_end and stage_id at days", () => {
    const masked = maskSetForReveal(baseSet, "days", false);
    expect(masked.time_start).toBe(baseSet.time_start);
    expect(masked.time_end).toBeNull();
    expect(masked.stage_id).toBeNull();
  });

  it("keeps time_start and stage_id, nulls time_end at stages", () => {
    const masked = maskSetForReveal(baseSet, "stages", false);
    expect(masked.time_start).toBe(baseSet.time_start);
    expect(masked.time_end).toBeNull();
    expect(masked.stage_id).toBe(baseSet.stage_id);
  });

  it("does not mutate the original set", () => {
    const original = { ...baseSet };
    maskSetForReveal(baseSet, "draft", false);
    expect(baseSet).toEqual(original);
  });
});

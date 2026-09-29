import { describe, expect, it } from "vitest";
import {
  canShowDay,
  canShowStage,
  canShowTime,
  isAtLeast,
  revealLabels,
} from "./scheduleReveal";

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

describe("revealLabels", () => {
  const timedSet = {
    time_start: "2026-07-11T20:00:00Z",
    time_end: "2026-07-11T22:00:00Z",
    status: "confirmed",
    stage_id: "stage-1",
  };

  const tbaSet = {
    time_start: "2026-07-11T00:00:00Z",
    time_end: null,
    status: "tba",
    stage_id: "stage-1",
  };

  const dateless = {
    time_start: null,
    time_end: null,
    status: "tba",
    stage_id: "stage-1",
  };

  it("shows the exact time range at full reveal for a timed set", () => {
    const { timeLabel, dayLabel } = revealLabels(timedSet, "full", "UTC", true);
    expect(timeLabel).toContain("20:00");
    expect(dayLabel).toBeUndefined();
  });

  it("shows day-only for a timed set below full reveal", () => {
    const { dayLabel, timeLabel } = revealLabels(timedSet, "days", "UTC", true);
    expect(dayLabel).toBeDefined();
    expect(dayLabel).not.toContain("20:00");
    expect(timeLabel).toBeUndefined();
  });

  it("shows neither label when day isn't revealed", () => {
    const { dayLabel, timeLabel } = revealLabels(
      timedSet,
      "draft",
      "UTC",
      true,
    );
    expect(dayLabel).toBeUndefined();
    expect(timeLabel).toBeUndefined();
  });

  it("shows day + TBA at full reveal for a TBA set, never the midnight placeholder time", () => {
    const { dayLabel, timeLabel } = revealLabels(tbaSet, "full", "UTC", true);
    expect(dayLabel).toContain("TBA");
    expect(dayLabel).not.toContain("00:00");
    expect(timeLabel).toBeUndefined();
  });

  it("shows day + TBA below full reveal too, for a TBA set", () => {
    const { dayLabel } = revealLabels(tbaSet, "days", "UTC", true);
    expect(dayLabel).toContain("TBA");
    expect(dayLabel).not.toContain("00:00");
  });

  it("shows neither label for a TBA set when day isn't revealed", () => {
    const { dayLabel, timeLabel } = revealLabels(tbaSet, "draft", "UTC", true);
    expect(dayLabel).toBeUndefined();
    expect(timeLabel).toBeUndefined();
  });

  it('shows "Time TBA" for a dateless TBA set, once day-level reveal is on', () => {
    expect(revealLabels(dateless, "full", "UTC", true).dayLabel).toBe(
      "Time TBA",
    );
  });

  it("shows neither label for a dateless TBA set when day isn't revealed", () => {
    const { dayLabel, timeLabel } = revealLabels(
      dateless,
      "draft",
      "UTC",
      true,
    );
    expect(dayLabel).toBeUndefined();
    expect(timeLabel).toBeUndefined();
  });

  it("never sets both dayLabel and timeLabel", () => {
    for (const level of ["draft", "days", "stages", "full"] as const) {
      for (const set of [timedSet, tbaSet, dateless]) {
        const { dayLabel, timeLabel } = revealLabels(set, level, "UTC", true);
        expect(dayLabel && timeLabel).toBeFalsy();
      }
    }
  });

  it("nulls stageId below stage-level reveal", () => {
    expect(revealLabels(timedSet, "draft", "UTC", true).stageId).toBeNull();
    expect(revealLabels(timedSet, "days", "UTC", true).stageId).toBeNull();
  });

  it("exposes stageId from stage-level reveal onward", () => {
    expect(revealLabels(timedSet, "stages", "UTC", true).stageId).toBe(
      "stage-1",
    );
    expect(revealLabels(timedSet, "full", "UTC", true).stageId).toBe("stage-1");
  });

  it("nulls stageId regardless of reveal level when the set has no stage", () => {
    expect(
      revealLabels({ ...timedSet, stage_id: null }, "full", "UTC", true)
        .stageId,
    ).toBeNull();
  });
});

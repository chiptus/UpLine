import { describe, expect, it } from "vitest";
import {
  canShowDay,
  canShowStage,
  canShowTime,
  isAtLeast,
  computeRevealLabels,
  scheduleLabel,
  type RevealLevel,
} from "./scheduleReveal";

const ALL_LEVELS: RevealLevel[] = ["draft", "days", "stages", "full"];

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

describe("computeRevealLabels", () => {
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
    const { timeLabel, dayLabel } = computeRevealLabels(timedSet, {
      level: "full",
      dayConfig: { timezone: "UTC" },
      use24Hour: true,
    });
    expect(timeLabel).toContain("20:00");
    expect(dayLabel).toBeUndefined();
  });

  it.each(["days", "stages"] as const)(
    "shows day-only for a timed set at %s reveal",
    (level) => {
      const { dayLabel, timeLabel } = computeRevealLabels(timedSet, {
        level: level,
        dayConfig: { timezone: "UTC" },
        use24Hour: true,
      });
      expect(dayLabel).toBeDefined();
      expect(dayLabel).not.toContain("20:00");
      expect(timeLabel).toBeUndefined();
    },
  );

  it("shows neither label when day isn't revealed", () => {
    const { dayLabel, timeLabel } = computeRevealLabels(timedSet, {
      level: "draft",
      dayConfig: { timezone: "UTC" },
      use24Hour: true,
    });
    expect(dayLabel).toBeUndefined();
    expect(timeLabel).toBeUndefined();
  });

  it("shows day + TBA at full reveal for a TBA set, never the midnight placeholder time", () => {
    const { dayLabel, timeLabel } = computeRevealLabels(tbaSet, {
      level: "full",
      dayConfig: { timezone: "UTC" },
      use24Hour: true,
    });
    expect(dayLabel).toContain("TBA");
    expect(dayLabel).not.toContain("00:00");
    expect(timeLabel).toBeUndefined();
  });

  it("shows day + TBA below full reveal too, for a TBA set", () => {
    const { dayLabel } = computeRevealLabels(tbaSet, {
      level: "days",
      dayConfig: { timezone: "UTC" },
      use24Hour: true,
    });
    expect(dayLabel).toContain("TBA");
    expect(dayLabel).not.toContain("00:00");
  });

  it("shows neither label for a TBA set when day isn't revealed", () => {
    const { dayLabel, timeLabel } = computeRevealLabels(tbaSet, {
      level: "draft",
      dayConfig: { timezone: "UTC" },
      use24Hour: true,
    });
    expect(dayLabel).toBeUndefined();
    expect(timeLabel).toBeUndefined();
  });

  it('shows "Time TBA" for a dateless TBA set, once day-level reveal is on', () => {
    expect(
      computeRevealLabels(dateless, {
        level: "full",
        dayConfig: { timezone: "UTC" },
        use24Hour: true,
      }).dayLabel,
    ).toBe("Time TBA");
  });

  it("shows neither label for a dateless TBA set when day isn't revealed", () => {
    const { dayLabel, timeLabel } = computeRevealLabels(dateless, {
      level: "draft",
      dayConfig: { timezone: "UTC" },
      use24Hour: true,
    });
    expect(dayLabel).toBeUndefined();
    expect(timeLabel).toBeUndefined();
  });

  it("never sets both dayLabel and timeLabel", () => {
    for (const level of ["draft", "days", "stages", "full"] as const) {
      for (const set of [timedSet, tbaSet, dateless]) {
        const { dayLabel, timeLabel } = computeRevealLabels(set, {
          level: level,
          dayConfig: { timezone: "UTC" },
          use24Hour: true,
        });
        expect(dayLabel && timeLabel).toBeFalsy();
      }
    }
  });

  it.each(ALL_LEVELS)(
    "masks stageId at %s reveal by whether stage-level is met, regardless of whether the set has a stage",
    (level) => {
      const expectedWhenPresent = canShowStage(level) ? "stage-1" : null;
      expect(
        computeRevealLabels(timedSet, {
          level: level,
          dayConfig: { timezone: "UTC" },
          use24Hour: true,
        }).stageId,
      ).toBe(expectedWhenPresent);
      expect(
        computeRevealLabels(
          { ...timedSet, stage_id: null },
          { level: level, dayConfig: { timezone: "UTC" }, use24Hour: true },
        ).stageId,
      ).toBeNull();
    },
  );
});

describe("scheduleLabel", () => {
  it("prefers dayLabel over timeLabel", () => {
    expect(
      scheduleLabel({ dayLabel: "Fri, Jul 11", timeLabel: "20:00 - 22:00" }),
    ).toBe("Fri, Jul 11");
  });

  it("falls back to timeLabel when there's no dayLabel", () => {
    expect(scheduleLabel({ timeLabel: "20:00 - 22:00" })).toBe("20:00 - 22:00");
  });

  it("is undefined when neither label is set", () => {
    expect(scheduleLabel({})).toBeUndefined();
  });
});

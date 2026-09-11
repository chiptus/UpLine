import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScheduleData } from "./useScheduleData";
import type { FestivalSet } from "@/api/sets/types";
import type { Stage } from "@/api/stages/types";

const stage = { id: "stage-1", name: "Main Stage", stage_order: 0 } as Stage;

describe("useScheduleData", () => {
  it("includes a confirmed set with a real time", () => {
    const { result } = renderHook(() =>
      useScheduleData({
        sets: [makeSet({ id: "confirmed-set", status: "confirmed" })],
        stages: [stage],
      }),
    );

    expect(setIdsInSchedule(result.current.scheduleDays)).toEqual([
      "confirmed-set",
    ]);
  });

  it("excludes a TBA set (date-only or dateless) from the Schedule tab -- shown in Vote/Explore instead", () => {
    const { result } = renderHook(() =>
      useScheduleData({
        sets: [
          makeSet({ id: "confirmed-set", status: "confirmed" }),
          makeSet({ id: "tba-set", status: "tba" }),
        ],
        stages: [stage],
      }),
    );

    expect(setIdsInSchedule(result.current.scheduleDays)).toEqual([
      "confirmed-set",
    ]);
  });
});

function setIdsInSchedule(
  scheduleDays: ReturnType<typeof useScheduleData>["scheduleDays"],
): string[] {
  return scheduleDays.flatMap((day) =>
    day.stages.flatMap((s) => s.sets.map((set) => set.id)),
  );
}

function makeSet(overrides: {
  id: string;
  status: "confirmed" | "tba";
}): FestivalSet {
  return {
    id: overrides.id,
    name: `Set ${overrides.id}`,
    slug: overrides.id,
    stage_id: stage.id,
    time_start: "2026-07-11T20:00:00Z",
    time_end: "2026-07-11T21:00:00Z",
    status: overrides.status,
    set_type: null,
    artists: [],
    votes: [],
  } as unknown as FestivalSet;
}

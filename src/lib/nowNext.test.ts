import { describe, expect, it } from "vitest";
import { classifyNowNext, classifyNowNextByStage } from "./nowNext";

// Europe/Lisbon is UTC+1 (WEST) in August, so a set playing after midnight
// festival time still sits on the previous UTC calendar day. Classification
// compares instants, so the viewer-vs-festival day mismatch must not matter.
//
// Festival night of 2025-08-01 → 2025-08-02 (Lisbon wall clock):
//   23:00–00:00 Lisbon = 22:00Z–23:00Z
//   00:00–01:00 Lisbon (Aug 2) = 23:00Z–00:00Z (still Aug 1 in UTC)
const LATE_SET = {
  id: "late",
  time_start: "2025-08-01T22:00:00.000Z",
  time_end: "2025-08-01T23:00:00.000Z",
};
const MIDNIGHT_SET = {
  id: "midnight",
  time_start: "2025-08-01T23:00:00.000Z",
  time_end: "2025-08-02T00:00:00.000Z",
};

function at(iso: string): Date {
  return new Date(iso);
}

describe("classifyNowNext", () => {
  it("marks a set now-playing for now in [time_start, time_end)", () => {
    const { nowPlaying, next } = classifyNowNext(
      [LATE_SET, MIDNIGHT_SET],
      at("2025-08-01T22:30:00Z"),
    );
    expect(nowPlaying.map((s) => s.id)).toEqual(["late"]);
    expect(next.map((s) => s.id)).toEqual(["midnight"]);
  });

  it("is now-playing at exactly time_start (inclusive)", () => {
    const { nowPlaying } = classifyNowNext(
      [LATE_SET],
      at("2025-08-01T22:00:00Z"),
    );
    expect(nowPlaying.map((s) => s.id)).toEqual(["late"]);
  });

  it("is no longer now-playing at exactly time_end (exclusive)", () => {
    const { nowPlaying } = classifyNowNext(
      [LATE_SET, MIDNIGHT_SET],
      at("2025-08-01T23:00:00Z"),
    );
    expect(nowPlaying.map((s) => s.id)).toEqual(["midnight"]);
  });

  it("classifies across the festival midnight even when the UTC day differs", () => {
    // 00:30 Lisbon on Aug 2 is still Aug 1 in UTC — instant comparison only.
    const { nowPlaying, next } = classifyNowNext(
      [LATE_SET, MIDNIGHT_SET],
      at("2025-08-01T23:30:00Z"),
    );
    expect(nowPlaying.map((s) => s.id)).toEqual(["midnight"]);
    expect(next).toEqual([]);
  });

  it("selects only the nearest upcoming start as next, not everything upcoming", () => {
    const later = {
      id: "later",
      time_start: "2025-08-02T01:00:00.000Z",
      time_end: "2025-08-02T02:00:00.000Z",
    };
    const { next, laterPast } = classifyNowNext(
      [later, MIDNIGHT_SET, LATE_SET],
      at("2025-08-01T21:00:00Z"),
    );
    expect(next.map((s) => s.id)).toEqual(["late"]);
    expect(laterPast.map((s) => s.id)).toEqual(["midnight", "later"]);
  });

  it("includes all sets tied on the nearest start (multi-stage concurrency), ordered by id", () => {
    const stageB = { ...MIDNIGHT_SET, id: "a-other-stage" };
    const { next } = classifyNowNext(
      [MIDNIGHT_SET, stageB],
      at("2025-08-01T22:30:00Z"),
    );
    expect(next.map((s) => s.id)).toEqual(["a-other-stage", "midnight"]);
  });

  it("orders concurrent now-playing sets deterministically by start then id", () => {
    const overlapping = {
      id: "b-overlap",
      time_start: "2025-08-01T22:30:00.000Z",
      time_end: "2025-08-01T23:30:00.000Z",
    };
    const sameStart = { ...LATE_SET, id: "a-same-start" };
    const { nowPlaying } = classifyNowNext(
      [overlapping, LATE_SET, sameStart],
      at("2025-08-01T22:45:00Z"),
    );
    expect(nowPlaying.map((s) => s.id)).toEqual([
      "a-same-start",
      "late",
      "b-overlap",
    ]);
  });

  it("excludes sets with masked or missing times without error", () => {
    const masked = { id: "masked", time_start: null, time_end: null };
    const noEnd = {
      id: "no-end",
      time_start: "2025-08-01T22:00:00.000Z",
      time_end: null,
    };
    const { nowPlaying, next } = classifyNowNext(
      [masked, noEnd, MIDNIGHT_SET],
      at("2025-08-01T22:30:00Z"),
    );
    expect(nowPlaying).toEqual([]);
    expect(next.map((s) => s.id)).toEqual(["midnight"]);
  });

  it("excludes sets with unparseable times without error", () => {
    const broken = {
      id: "broken",
      time_start: "not-a-date",
      time_end: "also-not-a-date",
    };
    const { nowPlaying, next } = classifyNowNext(
      [broken],
      at("2025-08-01T22:30:00Z"),
    );
    expect(nowPlaying).toEqual([]);
    expect(next).toEqual([]);
  });

  it("classifies everything as later-past when the festival night is over", () => {
    const { nowPlaying, next, laterPast } = classifyNowNext(
      [LATE_SET, MIDNIGHT_SET],
      at("2025-08-02T03:00:00Z"),
    );
    expect(nowPlaying).toEqual([]);
    expect(next).toEqual([]);
    expect(laterPast.map((s) => s.id)).toEqual(["late", "midnight"]);
  });

  it("returns empty groups for an empty list", () => {
    expect(classifyNowNext([], at("2025-08-01T22:30:00Z"))).toEqual({
      nowPlaying: [],
      next: [],
      laterPast: [],
    });
  });
});

describe("classifyNowNextByStage", () => {
  const MAIN_NOW = { ...LATE_SET, id: "main-now", stage_id: "main" };
  const MAIN_NEXT = { ...MIDNIGHT_SET, id: "main-next", stage_id: "main" };
  const BEACH_SOON = {
    id: "beach-soon",
    stage_id: "beach",
    time_start: "2025-08-01T22:35:00.000Z",
    time_end: "2025-08-01T23:30:00.000Z",
  };

  it("classifies each stage independently — next is per-stage, not global", () => {
    // At 22:30Z the globally nearest upcoming start is beach-soon (22:35Z),
    // but main's own next must still be main-next (23:00Z).
    const byStage = classifyNowNextByStage(
      [MAIN_NOW, MAIN_NEXT, BEACH_SOON],
      at("2025-08-01T22:30:00Z"),
    );
    expect(byStage.get("main")?.nowPlaying.map((s) => s.id)).toEqual([
      "main-now",
    ]);
    expect(byStage.get("main")?.next.map((s) => s.id)).toEqual(["main-next"]);
    expect(byStage.get("beach")?.nowPlaying).toEqual([]);
    expect(byStage.get("beach")?.next.map((s) => s.id)).toEqual(["beach-soon"]);
  });

  it("excludes stage-less sets entirely", () => {
    const stageless = { ...LATE_SET, id: "stageless", stage_id: null };
    const byStage = classifyNowNextByStage(
      [stageless],
      at("2025-08-01T22:30:00Z"),
    );
    expect(byStage.size).toBe(0);
  });

  it("keeps masked-time exclusion within each stage", () => {
    const masked = {
      id: "masked",
      stage_id: "main",
      time_start: null,
      time_end: null,
    };
    const byStage = classifyNowNextByStage(
      [masked, MAIN_NOW],
      at("2025-08-01T22:30:00Z"),
    );
    expect(byStage.get("main")?.nowPlaying.map((s) => s.id)).toEqual([
      "main-now",
    ]);
    expect(byStage.get("main")?.laterPast).toEqual([]);
  });
});

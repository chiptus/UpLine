import { describe, expect, it } from "vitest";
import {
  getEffectiveFestivalPhase,
  getFestivalPhase,
  type FestivalPhase,
  type FestivalPhaseInput,
} from "./festivalPhase";

// Europe/Lisbon is UTC+1 (WEST) in August, so these calendar boundaries land
// on the previous UTC day — the festival-tz evaluation is what makes the phase
// correct for a viewer whose zone reads a different calendar day.
//   start_date 2025-08-01, end_date 2025-08-03
//   liveStart = 2025-07-31 00:00 Lisbon = 2025-07-30T23:00:00Z
//   liveEnd   = 2025-08-04 06:00 Lisbon = 2025-08-04T05:00:00Z
const TZ = "Europe/Lisbon";
const LIVE_START = "2025-07-30T23:00:00.000Z";
const LIVE_END = "2025-08-04T05:00:00.000Z";

function phase(overrides: Partial<FestivalPhaseInput>): FestivalPhase {
  return getFestivalPhase({
    revealLevel: "full",
    startDate: "2025-08-01",
    endDate: "2025-08-03",
    timezone: TZ,
    now: new Date(LIVE_START),
    ...overrides,
  });
}

describe("getFestivalPhase", () => {
  it("draft is Pre-Schedule regardless of dates or now", () => {
    expect(
      phase({ revealLevel: "draft", now: new Date("2025-08-02T12:00:00Z") }),
    ).toBe("pre-schedule");
    expect(
      phase({
        revealLevel: "draft",
        startDate: null,
        endDate: null,
        now: new Date("2030-01-01T00:00:00Z"),
      }),
    ).toBe("pre-schedule");
  });

  it("non-draft before liveStart is Planning", () => {
    expect(phase({ now: new Date("2025-07-30T22:59:59Z") })).toBe("planning");
  });

  it("is Live at the exact liveStart boundary (inclusive)", () => {
    // 2025-07-30T23:00:00Z is still July 30 in UTC but July 31 in Lisbon.
    expect(phase({ now: new Date(LIVE_START) })).toBe("live");
  });

  it("is Live between the boundaries", () => {
    expect(phase({ now: new Date("2025-08-02T12:00:00Z") })).toBe("live");
  });

  it("is Live at the exact liveEnd boundary (inclusive)", () => {
    expect(phase({ now: new Date(LIVE_END) })).toBe("live");
  });

  it("is Post-Festival just after liveEnd", () => {
    expect(phase({ now: new Date("2025-08-04T05:00:00.001Z") })).toBe(
      "post-festival",
    );
  });

  it("NULL start_date never reaches Live/Post (stays Planning)", () => {
    expect(
      phase({ startDate: null, now: new Date("2030-01-01T00:00:00Z") }),
    ).toBe("planning");
  });

  it("NULL end_date keeps Live and never flips to Post", () => {
    expect(
      phase({ endDate: null, now: new Date("2030-01-01T00:00:00Z") }),
    ).toBe("live");
  });

  it("degrades an unparseable start_date to Planning instead of throwing", () => {
    expect(
      phase({ startDate: "not-a-date", now: new Date("2030-01-01T00:00:00Z") }),
    ).toBe("planning");
  });

  it("degrades an unparseable end_date to Live (never Post)", () => {
    expect(
      phase({ endDate: "not-a-date", now: new Date("2030-01-01T00:00:00Z") }),
    ).toBe("live");
  });
});

describe("getEffectiveFestivalPhase", () => {
  const derivedCases: Array<{ label: string; input: Partial<FestivalPhaseInput>; derived: FestivalPhase }> = [
    { label: "Pre-Schedule", input: { revealLevel: "draft" }, derived: "pre-schedule" },
    { label: "Planning", input: { now: new Date("2025-07-30T22:59:59Z") }, derived: "planning" },
    { label: "Live", input: { now: new Date("2025-08-02T12:00:00Z") }, derived: "live" },
    {
      label: "Post-Festival",
      input: { now: new Date("2025-08-04T05:00:00.001Z") },
      derived: "post-festival",
    },
  ];

  const allPhases: FestivalPhase[] = [
    "pre-schedule",
    "planning",
    "live",
    "post-festival",
  ];

  for (const { label, input, derived } of derivedCases) {
    for (const override of allPhases) {
      it(`a non-null override (${override}) wins over derived ${label}`, () => {
        expect(
          getEffectiveFestivalPhase({
            override,
            derivedInput: {
              revealLevel: "full",
              startDate: "2025-08-01",
              endDate: "2025-08-03",
              timezone: TZ,
              now: new Date(LIVE_START),
              ...input,
            },
          }),
        ).toBe(override);
      });
    }

    it(`a null override falls through to derived ${label}`, () => {
      expect(
        getEffectiveFestivalPhase({
          override: null,
          derivedInput: {
            revealLevel: "full",
            startDate: "2025-08-01",
            endDate: "2025-08-03",
            timezone: TZ,
            now: new Date(LIVE_START),
            ...input,
          },
        }),
      ).toBe(derived);
    });
  }
});

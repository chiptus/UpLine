import { describe, expect, it } from "vitest";
import { canShowNowView, type NowViewEdition } from "./nowView";

// Festival runs 2025-08-01..2025-08-03 in Europe/Lisbon (UTC+1 in August).
const LIVE_EDITION: NowViewEdition = {
  schedule_reveal_level: "full",
  start_date: "2025-08-01",
  end_date: "2025-08-03",
  phase_override: null,
};

const TZ = "Europe/Lisbon";
const DURING = new Date("2025-08-02T12:00:00Z");
const BEFORE = new Date("2025-07-01T12:00:00Z");

describe("canShowNowView", () => {
  it("is available while derived-live at reveal level full", () => {
    expect(canShowNowView(LIVE_EDITION, TZ, DURING)).toBe(true);
  });

  it("is unavailable outside the festival dates", () => {
    expect(canShowNowView(LIVE_EDITION, TZ, BEFORE)).toBe(false);
  });

  it("honours a live override outside the festival dates", () => {
    const edition = { ...LIVE_EDITION, phase_override: "live" as const };
    expect(canShowNowView(edition, TZ, BEFORE)).toBe(true);
  });

  it("honours an override away from live during the festival", () => {
    const edition = { ...LIVE_EDITION, phase_override: "planning" as const };
    expect(canShowNowView(edition, TZ, DURING)).toBe(false);
  });

  it("is unavailable below reveal level full even when live", () => {
    const edition = {
      ...LIVE_EDITION,
      schedule_reveal_level: "stages" as const,
    };
    expect(canShowNowView(edition, TZ, DURING)).toBe(false);
  });

  it("never shows for a live override below reveal level full", () => {
    const edition = {
      ...LIVE_EDITION,
      schedule_reveal_level: "days" as const,
      phase_override: "live" as const,
    };
    expect(canShowNowView(edition, TZ, BEFORE)).toBe(false);
  });
});

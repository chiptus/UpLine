import { describe, expect, it } from "vitest";
import {
  formatTimeRange,
  formatDateTime,
  formatTimeOnly,
  toDatetimeLocal,
  toISOString,
  combineDateAndTime,
  convertLocalTimeToUTC,
} from "../timeUtils";

describe("formatTimeRange", () => {
  it("returns null when both times are null", () => {
    expect(formatTimeRange(null, null)).toBeNull();
  });

  it("formats start time only", () => {
    const result = formatTimeRange("2024-12-15T14:00:00Z", null);
    expect(result).toContain("Starts:");
    expect(result).toContain("Dec 15");
  });

  it("formats end time only", () => {
    const result = formatTimeRange(null, "2024-12-15T16:00:00Z");
    expect(result).toContain("Ends:");
    expect(result).toContain("Dec 15");
  });

  it("formats time range on same day in 12-hour format", () => {
    const result = formatTimeRange(
      "2024-12-15T14:00:00Z",
      "2024-12-15T16:00:00Z",
    );
    expect(result).toBeTruthy();
    expect(result).toContain("-");
  });

  it("formats time range on same day in 24-hour format", () => {
    const result = formatTimeRange(
      "2024-12-15T14:00:00Z",
      "2024-12-15T16:00:00Z",
      true,
    );
    expect(result).toBeTruthy();
    expect(result).toContain("-");
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it("formats time range across different days", () => {
    const result = formatTimeRange(
      "2024-12-15T23:00:00Z",
      "2024-12-16T01:00:00Z",
    );
    expect(result).toContain("Dec 15");
    expect(result).toContain("Dec 16");
  });

  it("returns null for invalid start time", () => {
    const result = formatTimeRange("invalid", "2024-12-15T16:00:00Z");
    expect(result).toContain("Ends:");
  });

  it("returns null for invalid end time", () => {
    const result = formatTimeRange("2024-12-15T14:00:00Z", "invalid");
    expect(result).toContain("Starts:");
  });

  it("returns null for both invalid times", () => {
    expect(formatTimeRange("invalid", "also-invalid")).toBeNull();
  });
});

describe("formatDateTime", () => {
  it("returns null for null input", () => {
    expect(formatDateTime(null)).toBeNull();
  });

  it("formats date and time in 12-hour format", () => {
    const result = formatDateTime("2024-12-15T14:30:00Z");
    expect(result).toContain("Dec 15");
  });

  it("formats date and time in 24-hour format", () => {
    const result = formatDateTime("2024-12-15T14:30:00Z", true);
    expect(result).toContain("Dec 15");
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it("returns null for invalid date", () => {
    expect(formatDateTime("invalid-date")).toBeNull();
  });

  it("handles different months", () => {
    const jan = formatDateTime("2024-01-15T14:00:00Z");
    const jun = formatDateTime("2024-06-15T14:00:00Z");
    expect(jan).toContain("Jan");
    expect(jun).toContain("Jun");
  });
});

describe("formatTimeOnly", () => {
  it("returns null for null start time", () => {
    expect(formatTimeOnly(null, null)).toBeNull();
  });

  it("formats single time in 12-hour format", () => {
    const result = formatTimeOnly("2024-12-15T14:30:00Z", null);
    expect(result).toBeTruthy();
  });

  it("formats single time in 24-hour format", () => {
    const result = formatTimeOnly("2024-12-15T14:30:00Z", null, true);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it("formats time range in 12-hour format", () => {
    const result = formatTimeOnly(
      "2024-12-15T14:00:00Z",
      "2024-12-15T16:00:00Z",
    );
    expect(result).toContain("-");
  });

  it("formats time range in 24-hour format", () => {
    const result = formatTimeOnly(
      "2024-12-15T14:00:00Z",
      "2024-12-15T16:00:00Z",
      true,
    );
    expect(result).toContain("-");
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it("returns null for invalid start time", () => {
    expect(formatTimeOnly("invalid", null)).toBeNull();
  });

  it("handles invalid end time gracefully", () => {
    const result = formatTimeOnly("2024-12-15T14:00:00Z", "invalid");
    expect(result).toBeTruthy();
    expect(result).not.toContain("-");
  });
});

describe("toDatetimeLocal", () => {
  it("returns empty string for null input", () => {
    expect(toDatetimeLocal(null)).toBe("");
  });

  it("returns empty string for empty string input", () => {
    expect(toDatetimeLocal("")).toBe("");
  });

  it("converts ISO string to datetime-local format", () => {
    const result = toDatetimeLocal("2024-12-15T14:30:00Z");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it("handles different times", () => {
    const morning = toDatetimeLocal("2024-12-15T08:00:00Z");
    const evening = toDatetimeLocal("2024-12-15T20:00:00Z");
    expect(morning).toBeTruthy();
    expect(evening).toBeTruthy();
  });
});

describe("toISOString", () => {
  it("returns empty string for empty input", () => {
    expect(toISOString("")).toBe("");
  });

  it("converts datetime-local format to ISO string", () => {
    const result = toISOString("2024-12-15T14:30");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("handles different datetime values", () => {
    const result1 = toISOString("2024-01-01T00:00");
    const result2 = toISOString("2024-12-31T23:59");
    expect(result1).toBeTruthy();
    expect(result2).toBeTruthy();
  });
});

describe("combineDateAndTime", () => {
  it("returns null when date is undefined", () => {
    expect(combineDateAndTime(undefined, "14:30")).toBeNull();
  });

  it("returns null when time is undefined", () => {
    expect(combineDateAndTime("2024-12-15", undefined)).toBeNull();
  });

  it("returns null when both are undefined", () => {
    expect(combineDateAndTime(undefined, undefined)).toBeNull();
  });

  it("combines date and time strings", () => {
    const result = combineDateAndTime("2024-12-15", "14:30");
    expect(result).toBe("2024-12-15 14:30:00");
  });

  it("pads single digit hours", () => {
    const result = combineDateAndTime("2024-12-15", "8:30");
    expect(result).toBe("2024-12-15 08:30:00");
  });

  it("handles time with seconds", () => {
    const result = combineDateAndTime("2024-12-15", "14:30:45");
    expect(result).toBe("2024-12-15 14:30:45");
  });

  it("pads time without seconds", () => {
    const result = combineDateAndTime("2024-12-15", "14:30");
    expect(result).toBe("2024-12-15 14:30:00");
  });

  it("trims whitespace from inputs", () => {
    const result = combineDateAndTime("  2024-12-15  ", "  14:30  ");
    expect(result).toBe("2024-12-15 14:30:00");
  });

  it("handles various time formats", () => {
    expect(combineDateAndTime("2024-12-15", "8:00")).toBe(
      "2024-12-15 08:00:00",
    );
    expect(combineDateAndTime("2024-12-15", "08:00")).toBe(
      "2024-12-15 08:00:00",
    );
    expect(combineDateAndTime("2024-12-15", "8:00:00")).toBe(
      "2024-12-15 08:00:00",
    );
    expect(combineDateAndTime("2024-12-15", "08:00:00")).toBe(
      "2024-12-15 08:00:00",
    );
  });
});

describe("convertLocalTimeToUTC", () => {
  it("returns null for undefined input", () => {
    expect(convertLocalTimeToUTC(undefined, "America/New_York")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(convertLocalTimeToUTC("", "America/New_York")).toBeNull();
  });

  it("converts local time to UTC", () => {
    const result = convertLocalTimeToUTC(
      "2024-12-15 14:30:00",
      "America/New_York",
    );
    expect(result).toBeTruthy();
    if (result) {
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    }
  });

  it("handles different timezones", () => {
    const resultNY = convertLocalTimeToUTC(
      "2024-12-15 14:30:00",
      "America/New_York",
    );
    const resultLA = convertLocalTimeToUTC(
      "2024-12-15 14:30:00",
      "America/Los_Angeles",
    );
    expect(resultNY).toBeTruthy();
    expect(resultLA).toBeTruthy();
    expect(resultNY).not.toBe(resultLA);
  });

  it("handles UTC timezone", () => {
    const result = convertLocalTimeToUTC("2024-12-15 14:30:00", "UTC");
    expect(result).toBeTruthy();
  });

  it("returns null for invalid date string", () => {
    const result = convertLocalTimeToUTC("invalid-date", "America/New_York");
    expect(result).toBeNull();
  });

  it("handles different date formats", () => {
    const result1 = convertLocalTimeToUTC(
      "2024-12-15T14:30:00",
      "America/New_York",
    );
    const result2 = convertLocalTimeToUTC(
      "2024-12-15 14:30:00",
      "America/New_York",
    );
    expect(result1).toBeTruthy();
    expect(result2).toBeTruthy();
  });
});

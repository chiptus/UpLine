import { describe, expect, it } from "vitest";
import { isEditionChangedError } from "./types";

describe("isEditionChangedError", () => {
  it("matches the commit_schedule watermark-mismatch marker", () => {
    expect(
      isEditionChangedError(
        "edition_changed_since_analyse: The schedule changed since this review was generated.",
      ),
    ).toBe(true);
  });

  it("does not match other commit failures", () => {
    expect(isEditionChangedError("Stage Mainstage not found in edition")).toBe(
      false,
    );
    expect(isEditionChangedError("")).toBe(false);
  });
});

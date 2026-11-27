import { describe, expect, it } from "vitest";
import { slugFieldSchema } from "./slugFieldSchema";

describe("slugFieldSchema", () => {
  it("accepts surrounding whitespace without changing internal hyphens", () => {
    expect(slugFieldSchema.parse("  boom-2025  ")).toBe("boom-2025");
  });

  it.each([
    ["", "Slug is required"],
    [" \t ", "Slug is required"],
    ["boom_2025", "Use only lowercase letters, numbers, and hyphens"],
    ["-boom", "Slug can't start or end with a hyphen"],
    ["boom--2025", "Slug can't contain two hyphens in a row"],
  ])("rejects %j with a specific message", (slug, message) => {
    const result = slugFieldSchema.safeParse(slug);

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      message,
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { isSlugUniqueViolation } from "./postgresErrors";

describe("isSlugUniqueViolation", () => {
  it("is true for a 23505 on a slug constraint", () => {
    expect(
      isSlugUniqueViolation({
        code: "23505",
        message:
          'duplicate key value violates unique constraint "festivals_slug_unique"',
      }),
    ).toBe(true);
  });

  it("is false for a 23505 on another constraint", () => {
    expect(
      isSlugUniqueViolation({
        code: "23505",
        message: 'duplicate key value violates unique constraint "other_key"',
      }),
    ).toBe(false);
  });

  it("is false for other codes and non-objects", () => {
    expect(isSlugUniqueViolation({ code: "42501", message: "slug" })).toBe(
      false,
    );
    expect(isSlugUniqueViolation(new Error("slug"))).toBe(false);
    expect(isSlugUniqueViolation(null)).toBe(false);
  });
});

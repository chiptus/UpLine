import { describe, expect, it } from "vitest";
import { isUniqueViolation } from "./postgresErrors";

describe("isUniqueViolation", () => {
  it("is true for a Postgres 23505 error", () => {
    expect(isUniqueViolation({ code: "23505", message: "dup" })).toBe(true);
  });

  it("is false for other codes and non-objects", () => {
    expect(isUniqueViolation({ code: "42501" })).toBe(false);
    expect(isUniqueViolation(new Error("boom"))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});

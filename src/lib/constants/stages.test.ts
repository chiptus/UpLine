import { describe, expect, it } from "vitest";
import { DEFAULT_STAGE_COLOR } from "./stages";

describe("DEFAULT_STAGE_COLOR", () => {
  it("is defined", () => {
    expect(DEFAULT_STAGE_COLOR).toBeDefined();
  });

  it("is a valid hex color", () => {
    expect(DEFAULT_STAGE_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("has the correct value", () => {
    expect(DEFAULT_STAGE_COLOR).toBe("#6b7280");
  });

  it("is a string", () => {
    expect(typeof DEFAULT_STAGE_COLOR).toBe("string");
  });

  it("starts with hash symbol", () => {
    expect(DEFAULT_STAGE_COLOR).toMatch(/^#/);
  });

  it("has 7 characters total", () => {
    expect(DEFAULT_STAGE_COLOR).toHaveLength(7);
  });
});

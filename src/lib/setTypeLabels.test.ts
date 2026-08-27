import { describe, expect, it } from "vitest";
import { Music, Hammer, Drama, Sparkles } from "lucide-react";
import { SET_TYPES } from "@/api/sets/types";
import { getSetTypeLabel, setTypeLabels } from "./setTypeLabels";

describe("setTypeLabels", () => {
  it("maps each type to its label and icon", () => {
    expect(setTypeLabels.music.label).toBe("Music");
    expect(setTypeLabels.music.icon).toBe(Music);
    expect(setTypeLabels.workshop.label).toBe("Workshop");
    expect(setTypeLabels.workshop.icon).toBe(Hammer);
    expect(setTypeLabels.performance.label).toBe("Performance");
    expect(setTypeLabels.performance.icon).toBe(Drama);
    expect(setTypeLabels.other.label).toBe("Other");
    expect(setTypeLabels.other.icon).toBe(Sparkles);
  });

  it("gives every type a color", () => {
    for (const type of SET_TYPES) {
      expect(setTypeLabels[type].color).toBeTruthy();
    }
  });

  it("gives every type a gradient for banner and placeholder tiles", () => {
    for (const type of SET_TYPES) {
      expect(setTypeLabels[type].gradient).toMatch(/^from-.+ to-.+$/);
    }
  });

  it("falls back to the other treatment for null", () => {
    expect(getSetTypeLabel(null)).toBe(setTypeLabels.other);
  });

  it("falls back to the other treatment for unknown values, including prototype keys", () => {
    expect(getSetTypeLabel("talk")).toBe(setTypeLabels.other);
    expect(getSetTypeLabel("toString")).toBe(setTypeLabels.other);
  });

  it("resolves known types by value", () => {
    expect(getSetTypeLabel("workshop")).toBe(setTypeLabels.workshop);
  });
});

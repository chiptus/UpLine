import { describe, expect, it } from "vitest";
import {
  VOTE_CONFIG,
  VOTES_TYPES,
  getVoteConfig,
  getVoteValue,
  type VoteType,
} from "./voteConfig";
import { Star, Heart, X, Minus } from "lucide-react";

describe("VOTE_CONFIG", () => {
  it("has correct structure for mustGo", () => {
    expect(VOTE_CONFIG.mustGo).toBeDefined();
    expect(VOTE_CONFIG.mustGo.value).toBe(2);
    expect(VOTE_CONFIG.mustGo.label).toBe("Must Go");
    expect(VOTE_CONFIG.mustGo.icon).toBe(Star);
  });

  it("has correct structure for interested", () => {
    expect(VOTE_CONFIG.interested).toBeDefined();
    expect(VOTE_CONFIG.interested.value).toBe(1);
    expect(VOTE_CONFIG.interested.label).toBe("Interested");
    expect(VOTE_CONFIG.interested.icon).toBe(Heart);
  });

  it("has correct structure for wontGo", () => {
    expect(VOTE_CONFIG.wontGo).toBeDefined();
    expect(VOTE_CONFIG.wontGo.value).toBe(-1);
    expect(VOTE_CONFIG.wontGo.label).toBe("Won't Go");
    expect(VOTE_CONFIG.wontGo.icon).toBe(X);
  });

  it("has correct structure for neutral", () => {
    expect(VOTE_CONFIG.neutral).toBeDefined();
    expect(VOTE_CONFIG.neutral.value).toBe(0);
    expect(VOTE_CONFIG.neutral.label).toBe("Neutral");
    expect(VOTE_CONFIG.neutral.icon).toBe(Minus);
  });

  it("has consistent properties across all vote types", () => {
    const requiredProps = [
      "value",
      "label",
      "icon",
      "bgColor",
      "iconColor",
      "textColor",
      "descColor",
      "circleColor",
      "buttonSelected",
      "buttonUnselected",
      "spinnerColor",
      "description",
    ];

    VOTES_TYPES.forEach((voteType) => {
      requiredProps.forEach((prop) => {
        expect(VOTE_CONFIG[voteType]).toHaveProperty(prop);
      });
    });
  });

  it("has unique values for each vote type", () => {
    const values = VOTES_TYPES.map((type) => VOTE_CONFIG[type].value);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(VOTES_TYPES.length);
  });

  it("has valid color classes", () => {
    VOTES_TYPES.forEach((voteType) => {
      const config = VOTE_CONFIG[voteType];
      expect(config.bgColor).toMatch(/^bg-/);
      expect(config.iconColor).toMatch(/^text-/);
      expect(config.textColor).toMatch(/^text-/);
      expect(config.circleColor).toMatch(/^bg-/);
    });
  });
});

describe("VOTES_TYPES", () => {
  it("contains all vote types", () => {
    expect(VOTES_TYPES).toEqual(["mustGo", "interested", "wontGo", "neutral"]);
  });

  it("is a readonly array", () => {
    expect(VOTES_TYPES).toHaveLength(4);
  });
});

describe("getVoteConfig", () => {
  it("returns correct vote type for value 2", () => {
    expect(getVoteConfig(2)).toBe("mustGo");
  });

  it("returns correct vote type for value 1", () => {
    expect(getVoteConfig(1)).toBe("interested");
  });

  it("returns correct vote type for value -1", () => {
    expect(getVoteConfig(-1)).toBe("wontGo");
  });

  it("returns correct vote type for value 0", () => {
    expect(getVoteConfig(0)).toBe("neutral");
  });

  it("returns undefined for invalid values", () => {
    expect(getVoteConfig(3)).toBeUndefined();
    expect(getVoteConfig(-2)).toBeUndefined();
    expect(getVoteConfig(999)).toBeUndefined();
  });

  it("returns undefined for non-numeric values", () => {
    expect(getVoteConfig(NaN)).toBeUndefined();
    expect(getVoteConfig(Infinity)).toBeUndefined();
    expect(getVoteConfig(-Infinity)).toBeUndefined();
  });

  it("returns correct vote type for all valid values", () => {
    const validMappings: Array<[number, VoteType]> = [
      [2, "mustGo"],
      [1, "interested"],
      [-1, "wontGo"],
      [0, "neutral"],
    ];

    validMappings.forEach(([value, expectedType]) => {
      expect(getVoteConfig(value)).toBe(expectedType);
    });
  });
});

describe("getVoteValue", () => {
  it("returns 2 for mustGo", () => {
    expect(getVoteValue("mustGo")).toBe(2);
  });

  it("returns 1 for interested", () => {
    expect(getVoteValue("interested")).toBe(1);
  });

  it("returns -1 for wontGo", () => {
    expect(getVoteValue("wontGo")).toBe(-1);
  });

  it("returns 0 for neutral", () => {
    expect(getVoteValue("neutral")).toBe(0);
  });

  it("returns correct values for all vote types", () => {
    const expectedValues: Record<VoteType, -1 | 0 | 1 | 2> = {
      mustGo: 2,
      interested: 1,
      wontGo: -1,
      neutral: 0,
    };

    VOTES_TYPES.forEach((voteType) => {
      expect(getVoteValue(voteType)).toBe(expectedValues[voteType]);
    });
  });
});

describe("getVoteConfig and getVoteValue integration", () => {
  it("should be inverse operations for valid values", () => {
    const validValues = [2, 1, -1, 0];

    validValues.forEach((value) => {
      const voteType = getVoteConfig(value);
      expect(voteType).toBeDefined();
      if (voteType) {
        expect(getVoteValue(voteType)).toBe(value);
      }
    });
  });

  it("should be inverse operations for valid types", () => {
    VOTES_TYPES.forEach((voteType) => {
      const value = getVoteValue(voteType);
      expect(getVoteConfig(value)).toBe(voteType);
    });
  });
});

import { describe, expect, it } from "vitest";
import { generateSlug, isValidSlug, sanitizeSlug } from "./slug";

describe("generateSlug", () => {
  it("converts basic text to lowercase slug", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
    expect(generateSlug("Test String")).toBe("test-string");
  });

  it("handles special characters", () => {
    expect(generateSlug("Hello & World!")).toBe("hello-world");
    expect(generateSlug("Test@#$%String")).toBe("test-string");
    expect(generateSlug("Special (chars) [here]")).toBe("special-chars-here");
  });

  it("handles multiple spaces and whitespace", () => {
    expect(generateSlug("  Multiple   Spaces  ")).toBe("multiple-spaces");
    expect(generateSlug("\t\nTabs and\r\nNewlines\t")).toBe(
      "tabs-and-newlines",
    );
  });

  it("collapses multiple hyphens", () => {
    expect(generateSlug("Test---Multiple--Hyphens")).toBe(
      "test-multiple-hyphens",
    );
    expect(generateSlug("A----B----C")).toBe("a-b-c");
  });

  it("removes leading and trailing hyphens", () => {
    expect(generateSlug("-Leading Hyphen")).toBe("leading-hyphen");
    expect(generateSlug("Trailing Hyphen-")).toBe("trailing-hyphen");
    expect(generateSlug("--Both Sides--")).toBe("both-sides");
  });

  it("handles numbers correctly", () => {
    expect(generateSlug("Test 123 Numbers")).toBe("test-123-numbers");
    expect(generateSlug("2024 Festival Edition")).toBe("2024-festival-edition");
  });

  it("handles edge cases", () => {
    expect(generateSlug("")).toBe("");
    expect(generateSlug("   ")).toBe("");
    expect(generateSlug("---")).toBe("");
    expect(generateSlug("@#$%")).toBe("");
  });

  it("handles unicode characters", () => {
    expect(generateSlug("Café Münchën")).toBe("caf-m-nch-n");
    expect(generateSlug("测试 Test")).toBe("test");
  });

  it("preserves existing hyphens appropriately", () => {
    expect(generateSlug("Pre-existing-hyphens")).toBe("pre-existing-hyphens");
    expect(generateSlug("Mix of-hyphens and spaces")).toBe(
      "mix-of-hyphens-and-spaces",
    );
  });
});

describe("isValidSlug", () => {
  it("validates correct slugs", () => {
    expect(isValidSlug("hello-world")).toBe(true);
    expect(isValidSlug("test-123")).toBe(true);
    expect(isValidSlug("simple")).toBe(true);
    expect(isValidSlug("2024-festival")).toBe(true);
    expect(isValidSlug("a-b-c-d")).toBe(true);
  });

  it("rejects invalid slugs", () => {
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("-leading-hyphen")).toBe(false);
    expect(isValidSlug("trailing-hyphen-")).toBe(false);
    expect(isValidSlug("UPPERCASE")).toBe(false);
    expect(isValidSlug("with spaces")).toBe(false);
    expect(isValidSlug("special!chars")).toBe(false);
    expect(isValidSlug("multiple--hyphens")).toBe(false);
  });

  it("handles edge cases", () => {
    expect(isValidSlug("a")).toBe(true);
    expect(isValidSlug("1")).toBe(true);
    expect(isValidSlug("-")).toBe(false);
    expect(isValidSlug("--")).toBe(false);
  });
});

describe("sanitizeSlug", () => {
  it("is an alias for generateSlug", () => {
    const testCases = [
      "Hello World",
      "Special!@#Characters",
      "  Multiple   Spaces  ",
      "2024-Festival-Edition",
    ];

    testCases.forEach((testCase) => {
      expect(sanitizeSlug(testCase)).toBe(generateSlug(testCase));
    });
  });

  it("produces valid slugs", () => {
    const inputs = [
      "Random Input!",
      "123 Test Case",
      "Special @#$ Characters",
      "   Whitespace   ",
    ];

    inputs.forEach((input) => {
      const result = sanitizeSlug(input);
      if (result !== "") {
        expect(isValidSlug(result)).toBe(true);
      }
    });
  });
});

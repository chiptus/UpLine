import { describe, it, expect } from "vitest";
import { detectTextAlignment, getTextAlignmentClasses } from "./textAlignment";

describe("textAlignment", () => {
  describe("detectTextAlignment", () => {
    it("should detect English as LTR", () => {
      const result = detectTextAlignment(
        "This is a test in English with multiple sentences to make it long enough for reliable detection.",
      );

      expect(result.language).toBe("eng");
      expect(result.direction).toBe("ltr");
      expect(result.textAlign).toBe("left");
    });

    it("should detect Arabic as RTL", () => {
      const result = detectTextAlignment(
        "هذا نص تجريبي باللغة العربية لاختبار اكتشاف اللغة والمحاذاة بشكل صحيح",
      );

      expect(result.language).toBe("arb");
      expect(result.direction).toBe("rtl");
      expect(result.textAlign).toBe("right");
    });

    it("should detect Hebrew as RTL", () => {
      const result = detectTextAlignment(
        "זהו טקסט לבדיקה בעברית כדי לבדוק זיהוי שפה ויישור בצורה נכונה",
      );

      expect(result.language).toBe("heb");
      expect(result.direction).toBe("rtl");
      expect(result.textAlign).toBe("right");
    });

    it("should handle short text with default values", () => {
      const result = detectTextAlignment("Hi");

      expect(result.language).toBe("und");
      expect(result.direction).toBe("ltr");
      expect(result.textAlign).toBe("left");
    });

    it("should handle empty text", () => {
      const result = detectTextAlignment("");

      expect(result.language).toBe("und");
      expect(result.direction).toBe("ltr");
      expect(result.textAlign).toBe("left");
    });

    it("should ignore markdown syntax when detecting language", () => {
      const result = detectTextAlignment(
        "# This is a **heading** in English with _emphasis_ and `code` blocks for testing language detection",
      );

      expect(result.language).toBe("eng");
      expect(result.direction).toBe("ltr");
      expect(result.textAlign).toBe("left");
    });
  });

  describe("getTextAlignmentClasses", () => {
    it("should return LTR classes for English text", () => {
      const classes = getTextAlignmentClasses(
        "This is English text that should be left-aligned with LTR direction.",
      );

      expect(classes).toBe("ltr text-left");
    });

    it("should return RTL classes for Arabic text", () => {
      const classes = getTextAlignmentClasses(
        "هذا نص عربي يجب أن يكون محاذي لليمين مع اتجاه من اليمين لليسار",
      );

      expect(classes).toBe("rtl text-right");
    });

    it("should return RTL classes for Hebrew text", () => {
      const classes = getTextAlignmentClasses(
        "זה טקסט עברי שצריך להיות מיושר לימין עם כיוון מימין לשמאל",
      );

      expect(classes).toBe("rtl text-right");
    });

    it("should return default LTR classes for short text", () => {
      const classes = getTextAlignmentClasses("Hi");

      expect(classes).toBe("ltr text-left");
    });
  });
});

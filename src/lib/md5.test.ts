import { describe, expect, it } from "vitest";
import { md5 } from "./md5";

describe("md5", () => {
  it("matches known MD5 test vectors", () => {
    expect(md5("")).toBe("d41d8cd98f00b204e9800998ecf8427e");
    expect(md5("hello")).toBe("5d41402abc4b2a76b9719d911017c592");
    expect(md5("The quick brown fox jumps over the lazy dog")).toBe(
      "9e107d9d372bb6826bd81d3542a419d6",
    );
  });

  it("handles multi-byte unicode input", () => {
    expect(md5("サカナクション")).toBe("f714de1c1033ed5e8c45b9d037551c23");
    expect(md5("Чайф")).toBe("bdb3fbba8654d6f7062989026137631a");
  });

  it("is deterministic across repeated calls", () => {
    expect(md5("Hello World")).toBe(md5("Hello World"));
  });

  it("handles input lengths around the block-padding boundary", () => {
    expect(md5("a".repeat(55))).toBe("ef1772b6dff9a122358552954ad0df65");
    expect(md5("a".repeat(56))).toBe("3b0c8ac703f828b04c6c197006d17218");
    expect(md5("a".repeat(64))).toBe("014842d480b571495a4a0363793f7367");
  });
});

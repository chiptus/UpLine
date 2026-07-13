import { describe, expect, it } from "vitest";
import { isGroupCreator } from "./groupPermissions";

describe("isGroupCreator", () => {
  it("is true when the user id matches created_by", () => {
    expect(isGroupCreator("user-1", "user-1")).toBe(true);
  });

  it("is false for a different member's user id", () => {
    expect(isGroupCreator("user-1", "user-2")).toBe(false);
  });
});

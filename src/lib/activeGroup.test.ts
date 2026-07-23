import { describe, expect, it } from "vitest";
import { resolveActiveGroupId } from "./activeGroup";

describe("resolveActiveGroupId", () => {
  it("returns undefined when the user has no groups", () => {
    expect(
      resolveActiveGroupId({ profileActiveGroupId: null, groupIds: [] }),
    ).toBeUndefined();
  });

  it("auto-activates the single group when no active group is set", () => {
    expect(
      resolveActiveGroupId({
        profileActiveGroupId: null,
        groupIds: ["group-1"],
      }),
    ).toBe("group-1");
  });

  it("does not auto-activate when the user belongs to multiple groups", () => {
    expect(
      resolveActiveGroupId({
        profileActiveGroupId: null,
        groupIds: ["group-1", "group-2"],
      }),
    ).toBeUndefined();
  });

  it("returns the persisted active group when it is still a membership", () => {
    expect(
      resolveActiveGroupId({
        profileActiveGroupId: "group-2",
        groupIds: ["group-1", "group-2"],
      }),
    ).toBe("group-2");
  });

  it("ignores a persisted active group the user is no longer a member of", () => {
    expect(
      resolveActiveGroupId({
        profileActiveGroupId: "group-3",
        groupIds: ["group-1", "group-2"],
      }),
    ).toBeUndefined();
  });

  it("falls back to auto-activation when the stale active group leaves exactly one membership", () => {
    expect(
      resolveActiveGroupId({
        profileActiveGroupId: "group-3",
        groupIds: ["group-1"],
      }),
    ).toBe("group-1");
  });

  it("prefers the persisted active group over auto-activation when only one group remains", () => {
    expect(
      resolveActiveGroupId({
        profileActiveGroupId: "group-1",
        groupIds: ["group-1"],
      }),
    ).toBe("group-1");
  });
});

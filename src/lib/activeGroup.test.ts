import { describe, expect, it } from "vitest";
import { resolveActiveGroupId, resolvePinnedScope } from "./activeGroup";

describe("resolveActiveGroupId", () => {
  it("returns undefined when the user has no groups", () => {
    expect(
      resolveActiveGroupId({ activeGroupId: null, groupIds: [] }),
    ).toBeUndefined();
  });

  it("auto-activates the single group when no active group is set", () => {
    expect(
      resolveActiveGroupId({ activeGroupId: null, groupIds: ["group-1"] }),
    ).toBe("group-1");
  });

  it("does not auto-activate when the user belongs to multiple groups", () => {
    expect(
      resolveActiveGroupId({
        activeGroupId: null,
        groupIds: ["group-1", "group-2"],
      }),
    ).toBeUndefined();
  });

  it("returns the persisted active group when it is still a membership", () => {
    expect(
      resolveActiveGroupId({
        activeGroupId: "group-2",
        groupIds: ["group-1", "group-2"],
      }),
    ).toBe("group-2");
  });

  it("ignores a persisted active group the user is no longer a member of", () => {
    expect(
      resolveActiveGroupId({
        activeGroupId: "group-3",
        groupIds: ["group-1", "group-2"],
      }),
    ).toBeUndefined();
  });

  it("falls back to auto-activation when the stale active group leaves exactly one membership", () => {
    expect(
      resolveActiveGroupId({
        activeGroupId: "group-3",
        groupIds: ["group-1"],
      }),
    ).toBe("group-1");
  });

  it("prefers the persisted active group over auto-activation when only one group remains", () => {
    expect(
      resolveActiveGroupId({
        activeGroupId: "group-1",
        groupIds: ["group-1"],
      }),
    ).toBe("group-1");
  });
});

describe("resolvePinnedScope", () => {
  it("auto-derives to the sole group when no scope has ever been chosen", () => {
    expect(
      resolvePinnedScope({
        activeGroupId: null,
        activeScope: null,
        groupIds: ["group-1"],
      }),
    ).toEqual({ kind: "group", groupId: "group-1" });
  });

  it("auto-derives to Everyone when no scope has been chosen and there are multiple groups", () => {
    expect(
      resolvePinnedScope({
        activeGroupId: null,
        activeScope: null,
        groupIds: ["group-1", "group-2"],
      }),
    ).toEqual({ kind: "everyone" });
  });

  it("auto-derives to Everyone when no scope has been chosen and there are no groups", () => {
    expect(
      resolvePinnedScope({
        activeGroupId: null,
        activeScope: null,
        groupIds: [],
      }),
    ).toEqual({ kind: "everyone" });
  });

  it("respects an explicit Everyone scope even when exactly one group exists", () => {
    expect(
      resolvePinnedScope({
        activeGroupId: "group-1",
        activeScope: "everyone",
        groupIds: ["group-1"],
      }),
    ).toEqual({ kind: "everyone" });
  });

  it("respects an explicit Me scope regardless of group membership", () => {
    expect(
      resolvePinnedScope({
        activeGroupId: "group-1",
        activeScope: "me",
        groupIds: ["group-1", "group-2"],
      }),
    ).toEqual({ kind: "me" });
  });

  it("resolves an explicit group scope through the active group id", () => {
    expect(
      resolvePinnedScope({
        activeGroupId: "group-2",
        activeScope: "group",
        groupIds: ["group-1", "group-2"],
      }),
    ).toEqual({ kind: "group", groupId: "group-2" });
  });

  it("falls back to Everyone when scope is explicitly group but the active group id is stale and ambiguous", () => {
    expect(
      resolvePinnedScope({
        activeGroupId: "group-3",
        activeScope: "group",
        groupIds: ["group-1", "group-2"],
      }),
    ).toEqual({ kind: "everyone" });
  });
});

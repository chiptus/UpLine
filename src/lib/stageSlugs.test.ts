import { describe, it, expect } from "vitest";
import {
  resolveStageIdsFromSlugs,
  resolveStageSlugsFromIds,
} from "./stageSlugs";

const stages = [
  { id: "id-1", slug: "main-stage" },
  { id: "id-2", slug: "second-stage" },
];

describe("resolveStageIdsFromSlugs", () => {
  it("resolves known slugs to ids", () => {
    expect(
      resolveStageIdsFromSlugs(["main-stage", "second-stage"], stages),
    ).toEqual(["id-1", "id-2"]);
  });

  it("drops unresolvable slugs instead of throwing", () => {
    expect(
      resolveStageIdsFromSlugs(["main-stage", "typo-stage"], stages),
    ).toEqual(["id-1"]);
  });

  it("returns empty array when nothing matches", () => {
    expect(resolveStageIdsFromSlugs(["unknown"], stages)).toEqual([]);
  });
});

describe("resolveStageSlugsFromIds", () => {
  it("resolves known ids to slugs", () => {
    expect(resolveStageSlugsFromIds(["id-1", "id-2"], stages)).toEqual([
      "main-stage",
      "second-stage",
    ]);
  });

  it("drops unresolvable ids", () => {
    expect(resolveStageSlugsFromIds(["id-1", "missing"], stages)).toEqual([
      "main-stage",
    ]);
  });
});

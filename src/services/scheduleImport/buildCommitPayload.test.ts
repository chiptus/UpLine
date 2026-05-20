import { describe, it, expect } from "vitest";
import { buildCommitPayload } from "./buildCommitPayload";
import { type DiffResult } from "./types";

describe("buildCommitPayload", () => {
  it("passes through clean artistsToCreate/stagesToCreate untouched", () => {
    const diff = makeDiff({
      cleanOperations: {
        artistsToCreate: [{ name: "Carl Cox", slug: "carl-cox" }],
        stagesToCreate: [{ name: "Secret Forest" }],
        setsToCreate: [],
        setsToUpdate: [],
      },
    });

    const payload = buildCommitPayload(diff, {}, {});
    expect(payload.artistsToCreate).toEqual([
      { name: "Carl Cox", slug: "carl-cox" },
    ]);
    expect(payload.stagesToCreate).toEqual([{ name: "Secret Forest" }]);
  });

  it("appends a stage to create when a mismatch is resolved as 'create'", () => {
    const diff = makeDiff({
      conflicts: {
        stageNameMismatches: [
          {
            csvValue: "Mainstage",
            closestDbValue: "Main Stage",
            dbStageId: "stage-1",
          },
        ],
        orphanedSets: [],
      },
    });

    const payload = buildCommitPayload(
      diff,
      { Mainstage: { action: "create" } },
      {},
    );
    expect(payload.stagesToCreate).toEqual([{ name: "Mainstage" }]);
  });

  it("remaps set stageName when mismatch is resolved as 'map'", () => {
    const diff = makeDiff({
      cleanOperations: {
        artistsToCreate: [],
        stagesToCreate: [],
        setsToCreate: [
          {
            name: "Carl Cox",
            description: null,
            stageName: "Mainstage",
            timeStart: null,
            timeEnd: null,
            artistSlugs: ["carl-cox"],
          },
        ],
        setsToUpdate: [],
      },
      conflicts: {
        stageNameMismatches: [
          {
            csvValue: "Mainstage",
            closestDbValue: "Main Stage",
            dbStageId: "stage-1",
          },
        ],
        orphanedSets: [],
      },
    });

    const payload = buildCommitPayload(
      diff,
      { Mainstage: { action: "map", dbStageName: "Main Stage" } },
      {},
    );
    expect(payload.setsToCreate[0].stageName).toBe("Main Stage");
    expect(payload.stagesToCreate).toEqual([]);
  });

  it("keeps non-mismatched stage names as-is", () => {
    const diff = makeDiff({
      cleanOperations: {
        artistsToCreate: [],
        stagesToCreate: [],
        setsToCreate: [
          {
            name: "Carl Cox",
            description: null,
            stageName: "Main Stage",
            timeStart: null,
            timeEnd: null,
            artistSlugs: ["carl-cox"],
          },
        ],
        setsToUpdate: [],
      },
    });

    const payload = buildCommitPayload(diff, {}, {});
    expect(payload.setsToCreate[0].stageName).toBe("Main Stage");
  });

  it("filters orphan archive ids based on resolutions", () => {
    const diff = makeDiff({
      conflicts: {
        stageNameMismatches: [],
        orphanedSets: [
          { id: "set-a", name: "A", stage: null, timeStart: null },
          { id: "set-b", name: "B", stage: null, timeStart: null },
          { id: "set-c", name: "C", stage: null, timeStart: null },
        ],
      },
    });

    const payload = buildCommitPayload(
      diff,
      {},
      { "set-a": "archive", "set-b": "keep" },
    );
    // set-a marked archive, set-b marked keep, set-c defaults to keep
    expect(payload.setIdsToArchive).toEqual(["set-a"]);
  });
});

function makeDiff(overrides: Partial<DiffResult> = {}): DiffResult {
  return {
    summary: {
      newArtists: 0,
      newStages: 0,
      setsMatched: 0,
      setsToCreate: 0,
      setsOrphaned: 0,
    },
    newArtistNames: [],
    cleanOperations: {
      artistsToCreate: [],
      stagesToCreate: [],
      setsToCreate: [],
      setsToUpdate: [],
    },
    conflicts: { stageNameMismatches: [], orphanedSets: [] },
    ...overrides,
  };
}

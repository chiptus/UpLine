import { describe, it, expect } from "vitest";
import {
  buildCommitPayload,
  parseScheduleCsv,
  type DiffResult,
} from "./scheduleImportService";

describe("parseScheduleCsv", () => {
  it("parses a full row with every column", () => {
    const csv = [
      "Artists,Set Name,Stage,Date,Start Time,End Time,Description",
      "Carl Cox,Carl Cox Live,Main Stage,2026-07-11,22:00,00:00,House set",
    ].join("\n");

    expect(parseScheduleCsv(csv)).toEqual([
      {
        artists: ["Carl Cox"],
        setName: "Carl Cox Live",
        stage: "Main Stage",
        date: "2026-07-11",
        startTime: "22:00",
        endTime: "00:00",
        description: "House set",
      },
    ]);
  });

  it("splits pipe-separated artists for B2B sets", () => {
    const csv = ["Artists", "Carl Cox | Peggy Gou"].join("\n");
    expect(parseScheduleCsv(csv)[0].artists).toEqual(["Carl Cox", "Peggy Gou"]);
  });

  it("omits optional columns when not present in the header", () => {
    const csv = ["Artists,Date", "DJ Tennis,2026-07-12"].join("\n");
    expect(parseScheduleCsv(csv)).toEqual([
      {
        artists: ["DJ Tennis"],
        setName: undefined,
        stage: undefined,
        date: "2026-07-12",
        startTime: undefined,
        endTime: undefined,
        description: undefined,
      },
    ]);
  });

  it("skips rows with no artists", () => {
    const csv = ["Artists,Stage", "Carl Cox,Main", ",Side", "Peggy Gou,"].join(
      "\n",
    );
    const rows = parseScheduleCsv(csv);
    expect(rows.map((r) => r.artists)).toEqual([["Carl Cox"], ["Peggy Gou"]]);
  });

  it("is case-insensitive about header names", () => {
    const csv = ["ARTISTS,STAGE", "Carl Cox,Main"].join("\n");
    expect(parseScheduleCsv(csv)[0].stage).toBe("Main");
  });
});

describe("buildCommitPayload", () => {
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

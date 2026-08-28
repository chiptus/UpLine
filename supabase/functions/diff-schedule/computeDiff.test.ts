import { assertEquals } from "jsr:@std/assert@1";
import { computeDiff } from "./computeDiff.ts";
import { makeArtist, makeSet, makeStage } from "./fixtures.ts";

Deno.test("new artist in CSV creates artist", () => {
  const result = computeDiff(
    [{ artists: ["New DJ"] }],
    [],
    [],
    [],
    "Europe/Lisbon",
  );
  assertEquals(result.cleanOperations.artistsToCreate.length, 1);
  assertEquals(result.cleanOperations.artistsToCreate[0].name, "New DJ");
  assertEquals(result.cleanOperations.artistsToCreate[0].slug, "new-dj");
  assertEquals(result.summary.newArtists, 1);
});

Deno.test("existing artist is not duplicated", () => {
  const artist = makeArtist("Carl Cox");
  const result = computeDiff(
    [{ artists: ["Carl Cox"] }],
    [],
    [],
    [artist],
    "Europe/Lisbon",
  );
  assertEquals(result.cleanOperations.artistsToCreate.length, 0);
  assertEquals(result.summary.newArtists, 0);
});

Deno.test("same new artist in multiple rows is created once", () => {
  const result = computeDiff(
    [{ artists: ["New DJ"] }, { artists: ["New DJ"] }],
    [],
    [],
    [],
    "Europe/Lisbon",
  );
  assertEquals(result.cleanOperations.artistsToCreate.length, 1);
});

Deno.test("CSV row with no DB match creates new set", () => {
  const result = computeDiff(
    [{ artists: ["Carl Cox"] }],
    [],
    [],
    [makeArtist("Carl Cox")],
    "Europe/Lisbon",
  );
  assertEquals(result.cleanOperations.setsToCreate.length, 1);
  assertEquals(result.cleanOperations.setsToUpdate.length, 0);
  assertEquals(result.summary.setsToCreate, 1);
});

Deno.test("CSV row matching existing set produces update", () => {
  const artist = makeArtist("Carl Cox");
  const set = makeSet("set-1", "Carl Cox", [artist]);
  const result = computeDiff(
    [{ artists: ["Carl Cox"] }],
    [],
    [set],
    [artist],
    "Europe/Lisbon",
  );
  assertEquals(result.cleanOperations.setsToUpdate.length, 1);
  assertEquals(result.cleanOperations.setsToUpdate[0].id, "set-1");
  assertEquals(result.cleanOperations.setsToCreate.length, 0);
  assertEquals(result.summary.setsMatched, 1);
});

Deno.test("set in DB but absent from CSV is orphaned", () => {
  const artist = makeArtist("DJ Tennis");
  const set = makeSet("set-2", "DJ Tennis", [artist]);
  const result = computeDiff([], [], [set], [artist], "Europe/Lisbon");
  assertEquals(result.conflicts.orphanedSets.length, 1);
  assertEquals(result.conflicts.orphanedSets[0].id, "set-2");
  assertEquals(result.summary.setsOrphaned, 1);
});

Deno.test("B2B set matched by combined artist key", () => {
  const cox = makeArtist("Carl Cox");
  const gou = makeArtist("Peggy Gou");
  const set = makeSet("set-b2b", "Carl Cox b2b Peggy Gou", [cox, gou]);
  const result = computeDiff(
    [{ artists: ["Carl Cox", "Peggy Gou"] }],
    [],
    [set],
    [cox, gou],
    "Europe/Lisbon",
  );
  assertEquals(result.cleanOperations.setsToUpdate.length, 1);
  assertEquals(result.cleanOperations.setsToUpdate[0].id, "set-b2b");
});

Deno.test("B2B artist order in CSV does not affect match", () => {
  const cox = makeArtist("Carl Cox");
  const gou = makeArtist("Peggy Gou");
  const set = makeSet("set-b2b", "Carl Cox b2b Peggy Gou", [cox, gou]);
  const result = computeDiff(
    [{ artists: ["Peggy Gou", "Carl Cox"] }],
    [],
    [set],
    [cox, gou],
    "Europe/Lisbon",
  );
  assertEquals(result.cleanOperations.setsToUpdate.length, 1);
});

Deno.test("exact stage name match uses canonical DB name in payload", () => {
  const artist = makeArtist("Carl Cox");
  const stage = makeStage("stage-1", "Main Stage");
  const result = computeDiff(
    [{ artists: ["Carl Cox"], stage: "Main Stage" }],
    [stage],
    [],
    [artist],
    "Europe/Lisbon",
  );
  assertEquals(result.cleanOperations.setsToCreate[0].stageName, "Main Stage");
});

Deno.test("stage name mismatch surfaced as conflict", () => {
  const artist = makeArtist("Carl Cox");
  const stage = makeStage("stage-1", "Main Stage");
  const result = computeDiff(
    [{ artists: ["Carl Cox"], stage: "Mainstage" }],
    [stage],
    [],
    [artist],
    "Europe/Lisbon",
  );
  assertEquals(result.conflicts.stageNameMismatches.length, 1);
  assertEquals(result.conflicts.stageNameMismatches[0].csvValue, "Mainstage");
  assertEquals(
    result.conflicts.stageNameMismatches[0].closestDbValue,
    "Main Stage",
  );
});

Deno.test("unknown stage creates new stage", () => {
  const artist = makeArtist("Carl Cox");
  const result = computeDiff(
    [{ artists: ["Carl Cox"], stage: "Secret Forest" }],
    [],
    [],
    [artist],
    "Europe/Lisbon",
  );
  assertEquals(result.cleanOperations.stagesToCreate.length, 1);
  assertEquals(result.cleanOperations.stagesToCreate[0].name, "Secret Forest");
});

Deno.test("end time before start time triggers midnight advance", () => {
  const artist = makeArtist("Carl Cox");
  const result = computeDiff(
    [
      {
        artists: ["Carl Cox"],
        date: "2026-07-11",
        startTime: "23:00",
        endTime: "01:00",
      },
    ],
    [],
    [],
    [artist],
    "UTC",
  );
  const created = result.cleanOperations.setsToCreate[0];
  assertEquals(created.timeStart, "2026-07-11T23:00:00.000Z");
  assertEquals(created.timeEnd, "2026-07-12T01:00:00.000Z");
});

Deno.test("set name falls back to b2b join when not provided", () => {
  const artist1 = makeArtist("Carl Cox");
  const artist2 = makeArtist("Peggy Gou");
  const result = computeDiff(
    [{ artists: ["Carl Cox", "Peggy Gou"] }],
    [],
    [],
    [artist1, artist2],
    "UTC",
  );
  assertEquals(
    result.cleanOperations.setsToCreate[0].name,
    "Carl Cox b2b Peggy Gou",
  );
});

Deno.test("explicit set name takes precedence over b2b fallback", () => {
  const artist = makeArtist("Carl Cox");
  const result = computeDiff(
    [{ artists: ["Carl Cox"], setName: "Carl Cox Live" }],
    [],
    [],
    [artist],
    "UTC",
  );
  assertEquals(result.cleanOperations.setsToCreate[0].name, "Carl Cox Live");
});

Deno.test("same stage mismatch from multiple rows surfaced once", () => {
  const artist1 = makeArtist("Artist A");
  const artist2 = makeArtist("Artist B");
  const stage = makeStage("stage-1", "Main Stage");
  const result = computeDiff(
    [
      { artists: ["Artist A"], stage: "Mainstage" },
      { artists: ["Artist B"], stage: "Mainstage" },
    ],
    [stage],
    [],
    [artist1, artist2],
    "UTC",
  );
  assertEquals(result.conflicts.stageNameMismatches.length, 1);
});

Deno.test("multiple candidates disambiguated by stage", () => {
  const artist = makeArtist("Carl Cox");
  const stage1 = makeStage("s1", "Stage One");
  const stage2 = makeStage("s2", "Stage Two");
  const set1 = makeSet("set-a", "Carl Cox", [artist], "s1");
  const set2 = makeSet("set-b", "Carl Cox", [artist], "s2");
  const result = computeDiff(
    [{ artists: ["Carl Cox"], stage: "Stage Two" }],
    [stage1, stage2],
    [set1, set2],
    [artist],
    "UTC",
  );
  assertEquals(result.cleanOperations.setsToUpdate.length, 1);
  assertEquals(result.cleanOperations.setsToUpdate[0].id, "set-b");
  assertEquals(result.conflicts.orphanedSets.length, 1);
  assertEquals(result.conflicts.orphanedSets[0].id, "set-a");
});

Deno.test(
  "same-roster candidates disambiguated by set name as last resort",
  () => {
    const artist = makeArtist("Carl Cox");
    const set1 = makeSet("set-a", "Carl Cox Live", [artist]);
    const set2 = makeSet("set-b", "Carl Cox DJ Set", [artist]);
    const result = computeDiff(
      [{ artists: ["Carl Cox"], setName: "Carl Cox DJ Set" }],
      [],
      [set1, set2],
      [artist],
      "UTC",
    );
    assertEquals(result.cleanOperations.setsToUpdate.length, 1);
    assertEquals(result.cleanOperations.setsToUpdate[0].id, "set-b");
  },
);

Deno.test("date narrowing beats a set-name match for roster rows", () => {
  const artist = makeArtist("Carl Cox");
  const set1 = makeSet(
    "set-a",
    "Carl Cox Live",
    [artist],
    null,
    "2026-07-11T20:00:00Z",
  );
  const set2 = makeSet(
    "set-b",
    "Carl Cox Sunset",
    [artist],
    null,
    "2026-07-12T20:00:00Z",
  );
  const result = computeDiff(
    [
      {
        artists: ["Carl Cox"],
        setName: "Carl Cox Live",
        date: "2026-07-12",
      },
    ],
    [],
    [set1, set2],
    [artist],
    "UTC",
  );
  assertEquals(result.cleanOperations.setsToUpdate.length, 1);
  assertEquals(result.cleanOperations.setsToUpdate[0].id, "set-b");
});

Deno.test(
  "same-roster sets on one stage across dates matched by the row's date",
  () => {
    const artist = makeArtist("Carl Cox");
    const stage = makeStage("s1", "Stage One");
    const set1 = makeSet(
      "set-a",
      "Carl Cox",
      [artist],
      "s1",
      "2026-07-11T20:00:00Z",
    );
    const set2 = makeSet(
      "set-b",
      "Carl Cox",
      [artist],
      "s1",
      "2026-07-12T20:00:00Z",
    );
    const result = computeDiff(
      [{ artists: ["Carl Cox"], stage: "Stage One", date: "2026-07-12" }],
      [stage],
      [set1, set2],
      [artist],
      "UTC",
    );
    assertEquals(result.cleanOperations.setsToUpdate.length, 1);
    assertEquals(result.cleanOperations.setsToUpdate[0].id, "set-b");
  },
);

Deno.test(
  "roster row's stage matching nothing falls back to date narrowing",
  () => {
    const artist = makeArtist("Carl Cox");
    const stage1 = makeStage("s1", "Stage One");
    const stage2 = makeStage("s2", "Stage Two");
    const stage3 = makeStage("s3", "Stage Three");
    const set1 = makeSet(
      "set-a",
      "Carl Cox",
      [artist],
      "s1",
      "2026-07-11T20:00:00Z",
    );
    const set2 = makeSet(
      "set-b",
      "Carl Cox",
      [artist],
      "s2",
      "2026-07-12T20:00:00Z",
    );
    const result = computeDiff(
      [{ artists: ["Carl Cox"], stage: "Stage Three", date: "2026-07-12" }],
      [stage1, stage2, stage3],
      [set1, set2],
      [artist],
      "UTC",
    );
    assertEquals(result.cleanOperations.setsToUpdate.length, 1);
    assertEquals(result.cleanOperations.setsToUpdate[0].id, "set-b");
  },
);

Deno.test(
  "row setType lands in the payload; absent setType becomes null",
  () => {
    const result = computeDiff(
      [{ artists: ["Carl Cox"], setType: "music" }, { artists: ["Peggy Gou"] }],
      [],
      [],
      [makeArtist("Carl Cox"), makeArtist("Peggy Gou")],
      "UTC",
    );
    assertEquals(result.cleanOperations.setsToCreate[0].setType, "music");
    assertEquals(result.cleanOperations.setsToCreate[1].setType, null);
  },
);

Deno.test("update payload carries the matched set's stored type", () => {
  const artist = makeArtist("Carl Cox");
  const set = { ...makeSet("set-1", "Carl Cox", [artist]), set_type: "music" };
  const result = computeDiff(
    [{ artists: ["Carl Cox"], setType: "workshop" }],
    [],
    [set],
    [artist],
    "UTC",
  );
  assertEquals(result.cleanOperations.setsToUpdate[0].previousSetType, "music");
  assertEquals(result.cleanOperations.setsToUpdate[0].setType, "workshop");
});

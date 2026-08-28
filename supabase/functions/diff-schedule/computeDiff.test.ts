import { assertEquals } from "jsr:@std/assert@1";
import { computeDiff } from "./computeDiff.ts";
import type { DbArtist, DbSet, DbStage } from "./types.ts";

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

function makeArtist(name: string): DbArtist {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  return { id: `id-${slug}`, name, slug };
}

function makeStage(id: string, name: string): DbStage {
  return { id, name };
}

function makeSet(
  id: string,
  name: string,
  artists: DbArtist[],
  stageId: string | null = null,
  timeStart: string | null = null,
): DbSet {
  return {
    id,
    name,
    description: null,
    set_type: null,
    stage_id: stageId,
    time_start: timeStart,
    time_end: null,
    set_artists: artists.map((a) => ({ artist_id: a.id, artists: a })),
  };
}

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

Deno.test("artist-less row creates a set with an empty roster", () => {
  const result = computeDiff(
    [{ artists: [], setName: "Morning Yoga", setType: "workshop" }],
    [],
    [],
    [],
    "UTC",
  );
  assertEquals(result.cleanOperations.setsToCreate.length, 1);
  assertEquals(result.cleanOperations.setsToCreate[0].name, "Morning Yoga");
  assertEquals(result.cleanOperations.setsToCreate[0].artistSlugs, []);
  assertEquals(result.cleanOperations.setsToCreate[0].setType, "workshop");
  assertEquals(result.summary.newArtists, 0);
});

Deno.test("artist-less row matches an existing 0-artist set by name", () => {
  const set = makeSet("set-yoga", "Morning Yoga", []);
  const result = computeDiff(
    [{ artists: [], setName: "morning yoga" }],
    [],
    [set],
    [],
    "UTC",
  );
  assertEquals(result.cleanOperations.setsToUpdate.length, 1);
  assertEquals(result.cleanOperations.setsToUpdate[0].id, "set-yoga");
  assertEquals(result.cleanOperations.setsToCreate.length, 0);
  assertEquals(result.conflicts.orphanedSets.length, 0);
});

Deno.test(
  "artist-less row does not match a same-name set that has artists",
  () => {
    const artist = makeArtist("Carl Cox");
    const set = makeSet("set-cox", "Morning Yoga", [artist]);
    const result = computeDiff(
      [{ artists: [], setName: "Morning Yoga" }],
      [],
      [set],
      [artist],
      "UTC",
    );
    assertEquals(result.cleanOperations.setsToCreate.length, 1);
    assertEquals(result.cleanOperations.setsToUpdate.length, 0);
    assertEquals(result.conflicts.orphanedSets.length, 1);
  },
);

Deno.test("roster row does not match a 0-artist set", () => {
  const artist = makeArtist("Carl Cox");
  const set = makeSet("set-empty", "Carl Cox", []);
  const result = computeDiff(
    [{ artists: ["Carl Cox"] }],
    [],
    [set],
    [artist],
    "UTC",
  );
  assertEquals(result.cleanOperations.setsToCreate.length, 1);
  assertEquals(result.cleanOperations.setsToUpdate.length, 0);
  assertEquals(result.conflicts.orphanedSets.length, 1);
});

Deno.test("same-name artist-less candidates disambiguated by stage", () => {
  const stage1 = makeStage("s1", "Stage One");
  const stage2 = makeStage("s2", "Stage Two");
  const set1 = makeSet("set-a", "Fire Show", [], "s1");
  const set2 = makeSet("set-b", "Fire Show", [], "s2");
  const result = computeDiff(
    [{ artists: [], setName: "Fire Show", stage: "Stage Two" }],
    [stage1, stage2],
    [set1, set2],
    [],
    "UTC",
  );
  assertEquals(result.cleanOperations.setsToUpdate.length, 1);
  assertEquals(result.cleanOperations.setsToUpdate[0].id, "set-b");
  assertEquals(result.conflicts.orphanedSets.length, 1);
  assertEquals(result.conflicts.orphanedSets[0].id, "set-a");
});

Deno.test(
  "same name and stage on different dates disambiguated by date",
  () => {
    const stage = makeStage("s1", "Workshop Tent");
    const set1 = makeSet(
      "set-a",
      "Fire Show",
      [],
      "s1",
      "2026-07-11T20:00:00Z",
    );
    const set2 = makeSet(
      "set-b",
      "Fire Show",
      [],
      "s1",
      "2026-07-12T20:00:00Z",
    );
    const result = computeDiff(
      [
        {
          artists: [],
          setName: "Fire Show",
          stage: "Workshop Tent",
          date: "2026-07-12",
        },
      ],
      [stage],
      [set1, set2],
      [],
      "UTC",
    );
    assertEquals(result.cleanOperations.setsToUpdate.length, 1);
    assertEquals(result.cleanOperations.setsToUpdate[0].id, "set-b");
  },
);

Deno.test("same-name artist-less candidates disambiguated by date", () => {
  const set1 = makeSet("set-a", "Fire Show", [], null, "2026-07-11T20:00:00Z");
  const set2 = makeSet("set-b", "Fire Show", [], null, "2026-07-12T20:00:00Z");
  const result = computeDiff(
    [{ artists: [], setName: "Fire Show", date: "2026-07-12" }],
    [],
    [set1, set2],
    [],
    "UTC",
  );
  assertEquals(result.cleanOperations.setsToUpdate.length, 1);
  assertEquals(result.cleanOperations.setsToUpdate[0].id, "set-b");
});

Deno.test(
  "artist-less row on a different date creates instead of updating",
  () => {
    const set = makeSet("set-a", "Fire Show", [], null, "2026-07-11T20:00:00Z");
    const result = computeDiff(
      [{ artists: [], setName: "Fire Show", date: "2026-07-12" }],
      [],
      [set],
      [],
      "UTC",
    );
    assertEquals(result.cleanOperations.setsToUpdate.length, 0);
    assertEquals(result.cleanOperations.setsToCreate.length, 1);
    assertEquals(result.conflicts.orphanedSets.length, 1);
    assertEquals(result.conflicts.orphanedSets[0].id, "set-a");
  },
);

Deno.test(
  "artist-less row on a different stage creates instead of updating",
  () => {
    const stage1 = makeStage("s1", "Stage One");
    const stage2 = makeStage("s2", "Stage Two");
    const set = makeSet("set-a", "Fire Show", [], "s1");
    const result = computeDiff(
      [{ artists: [], setName: "Fire Show", stage: "Stage Two" }],
      [stage1, stage2],
      [set],
      [],
      "UTC",
    );
    assertEquals(result.cleanOperations.setsToUpdate.length, 0);
    assertEquals(result.cleanOperations.setsToCreate.length, 1);
    assertEquals(result.conflicts.orphanedSets.length, 1);
  },
);

Deno.test(
  "artist-less row with a date still matches a stored set without a time",
  () => {
    const set = makeSet("set-a", "Fire Show", []);
    const result = computeDiff(
      [{ artists: [], setName: "Fire Show", date: "2026-07-12" }],
      [],
      [set],
      [],
      "UTC",
    );
    assertEquals(result.cleanOperations.setsToUpdate.length, 1);
    assertEquals(result.cleanOperations.setsToUpdate[0].id, "set-a");
  },
);

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
  "artist-less row at a new stage creates instead of updating a staged set",
  () => {
    const stage = makeStage("s1", "Stage One");
    const set = makeSet("set-a", "Fire Show", [], "s1");
    const result = computeDiff(
      [{ artists: [], setName: "Fire Show", stage: "Secret Forest" }],
      [stage],
      [set],
      [],
      "UTC",
    );
    assertEquals(result.cleanOperations.setsToUpdate.length, 0);
    assertEquals(result.cleanOperations.setsToCreate.length, 1);
    assertEquals(result.conflicts.orphanedSets.length, 1);
  },
);

Deno.test(
  "artist-less row at a new stage still matches a stage-less stored set",
  () => {
    const set = makeSet("set-a", "Fire Show", []);
    const result = computeDiff(
      [{ artists: [], setName: "Fire Show", stage: "Secret Forest" }],
      [],
      [set],
      [],
      "UTC",
    );
    assertEquals(result.cleanOperations.setsToUpdate.length, 1);
    assertEquals(result.cleanOperations.setsToUpdate[0].id, "set-a");
  },
);

Deno.test(
  "mismatched stage matches artist-less sets via its closest stage",
  () => {
    const stage1 = makeStage("s1", "Main Stage");
    const stage2 = makeStage("s2", "Side");
    const set1 = makeSet("set-a", "Fire Show", [], "s2");
    const set2 = makeSet("set-b", "Fire Show", [], "s1");
    const result = computeDiff(
      [{ artists: [], setName: "Fire Show", stage: "Mainstage" }],
      [stage1, stage2],
      [set1, set2],
      [],
      "UTC",
    );
    assertEquals(result.cleanOperations.setsToUpdate.length, 1);
    assertEquals(result.cleanOperations.setsToUpdate[0].id, "set-b");
  },
);

Deno.test(
  "mismatched stage excludes an artist-less set at a different stage",
  () => {
    const stage1 = makeStage("s1", "Main Stage");
    const stage2 = makeStage("s2", "Side");
    const set = makeSet("set-a", "Fire Show", [], "s2");
    const result = computeDiff(
      [{ artists: [], setName: "Fire Show", stage: "Mainstage" }],
      [stage1, stage2],
      [set],
      [],
      "UTC",
    );
    assertEquals(result.cleanOperations.setsToUpdate.length, 0);
    assertEquals(result.cleanOperations.setsToCreate.length, 1);
  },
);

Deno.test("dated artist-less candidate preferred over an undated one", () => {
  const set1 = makeSet("set-a", "Fire Show", []);
  const set2 = makeSet("set-b", "Fire Show", [], null, "2026-07-12T20:00:00Z");
  const result = computeDiff(
    [{ artists: [], setName: "Fire Show", date: "2026-07-12" }],
    [],
    [set1, set2],
    [],
    "UTC",
  );
  assertEquals(result.cleanOperations.setsToUpdate.length, 1);
  assertEquals(result.cleanOperations.setsToUpdate[0].id, "set-b");
});

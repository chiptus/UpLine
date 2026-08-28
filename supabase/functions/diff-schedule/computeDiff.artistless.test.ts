import { assertEquals } from "jsr:@std/assert@1";
import { computeDiff } from "./computeDiff.ts";
import { makeArtist, makeSet, makeStage } from "./fixtures.ts";

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

// Pins the provisional closest-stage behavior; see #447 for its limit.
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

// Executable marker for #447: un-ignore once artist-less matching honors the
// user's stage-mismatch resolution instead of the closest-match guess pinned
// above. Encodes the conservative outcome (don't pick between staged
// candidates while the mismatch is unresolved); adjust it if #447 settles on
// passing resolutions into the diff instead.
Deno.test({
  name: "unresolved stage mismatch defers artist-less set selection (#447)",
  ignore: true,
  fn() {
    const stage1 = makeStage("s1", "Main Stage");
    const stage2 = makeStage("s2", "Main Stage East");
    const set1 = makeSet("set-a", "Fire Show", [], "s1");
    const set2 = makeSet("set-b", "Fire Show", [], "s2");
    const result = computeDiff(
      [{ artists: [], setName: "Fire Show", stage: "Mainstage" }],
      [stage1, stage2],
      [set1, set2],
      [],
      "UTC",
    );
    assertEquals(result.cleanOperations.setsToUpdate.length, 0);
  },
});

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

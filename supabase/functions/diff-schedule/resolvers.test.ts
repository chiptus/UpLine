import { assertEquals } from "jsr:@std/assert@1";
import {
  buildIndexes,
  computeTimes,
  findMatchingSet,
  resolveArtists,
  resolveStage,
} from "./resolvers.ts";
import type { DbArtist, DbSet, DbStage } from "./types.ts";

Deno.test("resolveArtists returns slugs and flags only unknown artists", () => {
  const result = resolveArtists(["Carl Cox", "New DJ"], new Set(["carl-cox"]));
  assertEquals(result.slugs, ["carl-cox", "new-dj"]);
  assertEquals(result.newArtists, [{ name: "New DJ", slug: "new-dj" }]);
});

Deno.test("resolveArtists does not mutate its arguments", () => {
  const existing = new Set(["carl-cox"]);
  resolveArtists(["New DJ"], existing);
  assertEquals(existing.has("new-dj"), false);
});

Deno.test("buildIndexes groups sets by sorted artist key", () => {
  const cox = makeArtist("Carl Cox");
  const gou = makeArtist("Peggy Gou");
  const indexes = buildIndexes([], [makeSet("set-1", [cox, gou])], [cox, gou]);
  assertEquals(indexes.setsByArtistKey.get("carl-cox|peggy-gou")?.length, 1);
  assertEquals(indexes.existingArtistSlugs.has("carl-cox"), true);
});

Deno.test("resolveStage returns exact match with canonical name", () => {
  const stage = makeStage("s1", "Main Stage");
  const result = resolveStage(
    "Main Stage",
    [stage],
    new Map([["main stage", stage]]),
  );
  assertEquals(result, { kind: "exact", id: "s1", name: "Main Stage" });
});

Deno.test("resolveStage flags a close name as a mismatch", () => {
  const stage = makeStage("s1", "Main Stage");
  const result = resolveStage(
    "Mainstage",
    [stage],
    new Map([["main stage", stage]]),
  );
  assertEquals(result.kind, "mismatch");
});

Deno.test("resolveStage treats an unknown name as new", () => {
  const result = resolveStage("Secret Forest", [], new Map());
  assertEquals(result, { kind: "new", resolvedName: "Secret Forest" });
});

Deno.test("resolveStage does not substring-match a short DB stage name", () => {
  const stage = makeStage("s1", "A");
  const result = resolveStage("Beach", [stage], new Map([["a", stage]]));
  assertEquals(result, { kind: "new", resolvedName: "Beach" });
});

Deno.test("resolveStage returns none when no stage given", () => {
  assertEquals(resolveStage(undefined, [], new Map()), { kind: "none" });
});

Deno.test("computeTimes converts local start/end to UTC", () => {
  const result = computeTimes(
    { date: "2026-07-11", startTime: "23:00", endTime: "01:00" },
    "UTC",
  );
  assertEquals(result.timeStart, "2026-07-11T23:00:00.000Z");
  assertEquals(result.timeEnd, "2026-07-12T01:00:00.000Z");
});

Deno.test("computeTimes returns nulls when date is missing", () => {
  assertEquals(computeTimes({ startTime: "23:00" }, "UTC"), {
    timeStart: null,
    timeEnd: null,
  });
});

Deno.test("findMatchingSet returns the only available candidate", () => {
  const set = makeSet("set-1", []);
  assertEquals(findMatchingSet([set], null, undefined, "UTC", new Set()), set);
});

Deno.test("findMatchingSet skips already-matched candidates", () => {
  const set = makeSet("set-1", []);
  assertEquals(
    findMatchingSet([set], null, undefined, "UTC", new Set(["set-1"])),
    null,
  );
});

Deno.test("findMatchingSet disambiguates by stage id", () => {
  const a = makeSet("set-a", [], "s1");
  const b = makeSet("set-b", [], "s2");
  assertEquals(
    findMatchingSet([a, b], "s2", undefined, "UTC", new Set())?.id,
    "set-b",
  );
});

Deno.test("findMatchingSet disambiguates by date", () => {
  const a = makeSet("set-a", [], null, "2026-07-11T20:00:00.000Z");
  const b = makeSet("set-b", [], null, "2026-07-12T20:00:00.000Z");
  assertEquals(
    findMatchingSet([a, b], null, "2026-07-12", "UTC", new Set())?.id,
    "set-b",
  );
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
  artists: DbArtist[],
  stageId: string | null = null,
  timeStart: string | null = null,
): DbSet {
  return {
    id,
    name: id,
    description: null,
    stage_id: stageId,
    time_start: timeStart,
    time_end: null,
    set_artists: artists.map((a) => ({ artist_id: a.id, artists: a })),
  };
}

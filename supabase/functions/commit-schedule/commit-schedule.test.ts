// Integration tests for commit-schedule.
// Run against a local Supabase instance: deno test --allow-env --allow-net commit-schedule.test.ts
//
// These tests require SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
// They test the commit_schedule RPC directly, which is the meaningful logic layer.
// The Edge Function itself is a thin auth + dispatch wrapper.

import { assertEquals, assertExists } from "jsr:@std/assert@1";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

async function getTestEditionId(
  db: ReturnType<typeof adminClient>,
): Promise<string> {
  const { data } = await db
    .from("festival_editions")
    .select("id")
    .limit(1)
    .single();
  assertExists(data, "No festival edition found — run test:setup first");
  return data.id;
}

async function getTestUserId(
  db: ReturnType<typeof adminClient>,
): Promise<string> {
  const { data } = await db
    .from("admin_roles")
    .select("user_id")
    .limit(1)
    .single();
  assertExists(data, "No admin user found — run test:setup first");
  return data.user_id;
}

// #42: commit_schedule now requires a watermark matching the edition's
// current state. Fetch it fresh (via the same RPC diff-schedule uses)
// right before each call so unrelated setup inserts above don't go stale.
async function getWatermark(
  db: ReturnType<typeof adminClient>,
  editionId: string,
): Promise<string> {
  const { data, error } = await db.rpc("commit_schedule__compute_watermark", {
    p_festival_edition_id: editionId,
  });
  assertEquals(error, null);
  return data as string;
}

Deno.test("commit_schedule: creates new artist and set", async () => {
  const db = adminClient();
  const editionId = await getTestEditionId(db);
  const userId = await getTestUserId(db);
  const slug = `test-artist-${Date.now()}`;
  const setName = `Test Artist Set ${slug}`;

  const { data, error } = await db.rpc("commit_schedule", {
    p_festival_edition_id: editionId,
    p_user_id: userId,
    p_watermark: await getWatermark(db, editionId),
    p_artists_to_create: [{ name: "Test Artist", slug }],
    p_stages_to_create: [],
    p_sets_to_create: [
      {
        name: setName,
        description: null,
        stageName: null,
        timeStart: null,
        timeEnd: null,
        artistSlugs: [slug],
      },
    ],
    p_sets_to_update: [],
    p_set_ids_to_archive: [],
  });

  assertEquals(error, null);
  assertEquals(data.setsCreated, 1);
  assertEquals(data.setsUpdated, 0);

  // Cleanup
  await db
    .from("sets")
    .delete()
    .eq("festival_edition_id", editionId)
    .eq("name", setName);
  await db.from("artists").delete().eq("slug", slug);
});

Deno.test(
  "commit_schedule: updates existing set without creating duplicate",
  async () => {
    const db = adminClient();
    const editionId = await getTestEditionId(db);
    const userId = await getTestUserId(db);
    const slug = `test-update-artist-${Date.now()}`;

    // Create artist and set
    await db
      .from("artists")
      .insert({ name: "Update Test", slug, added_by: userId });
    const { data: artist } = await db
      .from("artists")
      .select("id")
      .eq("slug", slug)
      .single();
    const { data: set } = await db
      .from("sets")
      .insert({
        festival_edition_id: editionId,
        name: "Old Name",
        slug: "old-name",
        created_by: userId,
      })
      .select("id")
      .single();
    await db
      .from("set_artists")
      .insert({ set_id: set!.id, artist_id: artist!.id });

    const { data, error } = await db.rpc("commit_schedule", {
      p_festival_edition_id: editionId,
      p_user_id: userId,
      p_watermark: await getWatermark(db, editionId),
      p_artists_to_create: [],
      p_stages_to_create: [],
      p_sets_to_create: [],
      p_sets_to_update: [
        {
          id: set!.id,
          name: "New Name",
          description: "Updated",
          stageName: null,
          timeStart: null,
          timeEnd: null,
          artistSlugs: [slug],
        },
      ],
      p_set_ids_to_archive: [],
    });

    assertEquals(error, null);
    assertEquals(data.setsUpdated, 1);

    const { data: updated } = await db
      .from("sets")
      .select("name, description")
      .eq("id", set!.id)
      .single();
    assertEquals(updated!.name, "New Name");
    assertEquals(updated!.description, "Updated");

    // Cleanup
    await db.from("sets").delete().eq("id", set!.id);
    await db.from("artists").delete().eq("slug", slug);
  },
);

Deno.test("commit_schedule: archives orphaned sets", async () => {
  const db = adminClient();
  const editionId = await getTestEditionId(db);
  const userId = await getTestUserId(db);

  const { data: set } = await db
    .from("sets")
    .insert({
      festival_edition_id: editionId,
      name: "Orphan Set",
      slug: "orphan-set",
      created_by: userId,
    })
    .select("id")
    .single();

  const { data, error } = await db.rpc("commit_schedule", {
    p_festival_edition_id: editionId,
    p_user_id: userId,
    p_watermark: await getWatermark(db, editionId),
    p_artists_to_create: [],
    p_stages_to_create: [],
    p_sets_to_create: [],
    p_sets_to_update: [],
    p_set_ids_to_archive: [set!.id],
  });

  assertEquals(error, null);
  assertEquals(data.setsArchived, 1);

  const { data: archived } = await db
    .from("sets")
    .select("archived")
    .eq("id", set!.id)
    .single();
  assertEquals(archived!.archived, true);

  // Cleanup
  await db.from("sets").delete().eq("id", set!.id);
});

Deno.test(
  "commit_schedule: two sets with the same name get distinct slugs",
  async () => {
    const db = adminClient();
    const editionId = await getTestEditionId(db);
    const userId = await getTestUserId(db);
    const setName = `Dup Name Set ${Date.now()}`;
    const artistSlug = `test-dup-set-artist-${Date.now()}`;

    await db
      .from("artists")
      .insert({ name: "Dup Set Artist", slug: artistSlug, added_by: userId });

    const { data, error } = await db.rpc("commit_schedule", {
      p_festival_edition_id: editionId,
      p_user_id: userId,
      p_watermark: await getWatermark(db, editionId),
      p_artists_to_create: [],
      p_stages_to_create: [],
      p_sets_to_create: [
        {
          name: setName,
          description: null,
          stageName: null,
          timeStart: null,
          timeEnd: null,
          artistSlugs: [artistSlug],
        },
        {
          name: setName,
          description: null,
          stageName: null,
          timeStart: null,
          timeEnd: null,
          artistSlugs: [artistSlug],
        },
      ],
      p_sets_to_update: [],
      p_set_ids_to_archive: [],
    });

    assertEquals(error, null);
    assertEquals(data.setsCreated, 2);

    const { data: sets } = await db
      .from("sets")
      .select("id, slug")
      .eq("festival_edition_id", editionId)
      .eq("name", setName);

    assertEquals(sets?.length, 2);
    assertExists(sets![0].slug);
    assertExists(sets![1].slug);
    assertEquals(sets![0].slug === sets![1].slug, false);

    // Cleanup
    await db
      .from("sets")
      .delete()
      .eq("festival_edition_id", editionId)
      .eq("name", setName);
    await db.from("artists").delete().eq("slug", artistSlug);
  },
);

Deno.test(
  "commit_schedule: creates an artist-less typed set with an empty roster",
  async () => {
    const db = adminClient();
    const editionId = await getTestEditionId(db);
    const userId = await getTestUserId(db);
    const setName = `Morning Yoga ${Date.now()}`;

    const { data, error } = await db.rpc("commit_schedule", {
      p_festival_edition_id: editionId,
      p_user_id: userId,
      p_watermark: await getWatermark(db, editionId),
      p_artists_to_create: [],
      p_stages_to_create: [],
      p_sets_to_create: [
        {
          name: setName,
          setType: "workshop",
          description: "Sun salutations",
          stageName: null,
          timeStart: null,
          timeEnd: null,
          artistSlugs: [],
        },
      ],
      p_sets_to_update: [],
      p_set_ids_to_archive: [],
    });

    assertEquals(error, null);
    assertEquals(data.setsCreated, 1);

    const { data: sets } = await db
      .from("sets")
      .select("id, set_type, set_artists(artist_id)")
      .eq("festival_edition_id", editionId)
      .eq("name", setName);

    assertExists(sets?.[0]);
    assertEquals(sets![0].set_type, "workshop");
    assertEquals(sets![0].set_artists.length, 0);

    // Cleanup
    await db.from("sets").delete().eq("id", sets![0].id);
  },
);

Deno.test(
  "commit_schedule: explicit type overwrites, null type preserves",
  async () => {
    const db = adminClient();
    const editionId = await getTestEditionId(db);
    const userId = await getTestUserId(db);
    const setName = `Type Roundtrip ${Date.now()}`;

    const { data: set } = await db
      .from("sets")
      .insert({
        festival_edition_id: editionId,
        name: setName,
        slug: `type-roundtrip-${Date.now()}`,
        set_type: "performance",
        created_by: userId,
      })
      .select("id")
      .single();

    const basePayload = {
      id: set!.id,
      name: setName,
      description: null,
      stageName: null,
      timeStart: null,
      timeEnd: null,
      artistSlugs: [],
    };

    // Explicit type overwrites the stored one.
    const { error: overwriteError } = await db.rpc("commit_schedule", {
      p_festival_edition_id: editionId,
      p_user_id: userId,
      p_watermark: await getWatermark(db, editionId),
      p_artists_to_create: [],
      p_stages_to_create: [],
      p_sets_to_create: [],
      p_sets_to_update: [{ ...basePayload, setType: "workshop" }],
      p_set_ids_to_archive: [],
    });
    assertEquals(overwriteError, null);

    const { data: afterOverwrite } = await db
      .from("sets")
      .select("set_type")
      .eq("id", set!.id)
      .single();
    assertEquals(afterOverwrite!.set_type, "workshop");

    // Null type (blank CSV column) preserves the stored one.
    const { error: preserveError } = await db.rpc("commit_schedule", {
      p_festival_edition_id: editionId,
      p_user_id: userId,
      p_watermark: await getWatermark(db, editionId),
      p_artists_to_create: [],
      p_stages_to_create: [],
      p_sets_to_create: [],
      p_sets_to_update: [{ ...basePayload, setType: null }],
      p_set_ids_to_archive: [],
    });
    assertEquals(preserveError, null);

    const { data: afterPreserve } = await db
      .from("sets")
      .select("set_type")
      .eq("id", set!.id)
      .single();
    assertEquals(afterPreserve!.set_type, "workshop");

    // Cleanup
    await db.from("sets").delete().eq("id", set!.id);
  },
);

Deno.test(
  "commit_schedule: midnight-crossing times stored correctly",
  async () => {
    const db = adminClient();
    const editionId = await getTestEditionId(db);
    const userId = await getTestUserId(db);
    const slug = `test-midnight-${Date.now()}`;

    await db
      .from("artists")
      .insert({ name: "Late Night DJ", slug, added_by: userId });

    const { error } = await db.rpc("commit_schedule", {
      p_festival_edition_id: editionId,
      p_user_id: userId,
      p_watermark: await getWatermark(db, editionId),
      p_artists_to_create: [],
      p_stages_to_create: [],
      p_sets_to_create: [
        {
          name: "Late Night Set",
          description: null,
          stageName: null,
          timeStart: "2026-07-11T23:00:00.000Z",
          timeEnd: "2026-07-12T01:00:00.000Z",
          artistSlugs: [slug],
        },
      ],
      p_sets_to_update: [],
      p_set_ids_to_archive: [],
    });

    assertEquals(error, null);

    const { data: sets } = await db
      .from("sets")
      .select("id, time_start, time_end, set_artists(artist_id, artists(slug))")
      .eq("festival_edition_id", editionId)
      .eq("name", "Late Night Set");

    assertExists(sets?.[0]);
    assertEquals(sets![0].time_start, "2026-07-11T23:00:00+00:00");
    assertEquals(sets![0].time_end, "2026-07-12T01:00:00+00:00");

    // Cleanup
    await db.from("sets").delete().eq("id", sets![0].id);
    await db.from("artists").delete().eq("slug", slug);
  },
);

Deno.test(
  "commit_schedule: aborts and applies nothing when the edition changed since the watermark was computed (#42)",
  async () => {
    const db = adminClient();
    const editionId = await getTestEditionId(db);
    const userId = await getTestUserId(db);
    const slug = `test-stale-watermark-${Date.now()}`;
    const setName = `Stale Watermark Set ${slug}`;

    const staleWatermark = await getWatermark(db, editionId);

    // Simulate a concurrent edit landing after Analyse: create an unrelated
    // set, which changes the edition's watermark.
    const { data: concurrentSet } = await db
      .from("sets")
      .insert({
        festival_edition_id: editionId,
        name: "Concurrent Edit",
        slug: `concurrent-edit-${Date.now()}`,
        created_by: userId,
      })
      .select("id")
      .single();

    const { data, error } = await db.rpc("commit_schedule", {
      p_festival_edition_id: editionId,
      p_user_id: userId,
      p_watermark: staleWatermark,
      p_artists_to_create: [{ name: "Stale Watermark Artist", slug }],
      p_stages_to_create: [],
      p_sets_to_create: [
        {
          name: setName,
          description: null,
          stageName: null,
          timeStart: null,
          timeEnd: null,
          artistSlugs: [slug],
        },
      ],
      p_sets_to_update: [],
      p_set_ids_to_archive: [],
    });

    assertExists(error, "expected commit_schedule to reject a stale watermark");
    assertEquals(data, null);

    // Nothing from the rejected commit was applied — same transaction.
    const { data: artist } = await db
      .from("artists")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    assertEquals(artist, null);

    const { data: sets } = await db
      .from("sets")
      .select("id")
      .eq("festival_edition_id", editionId)
      .eq("name", setName);
    assertEquals(sets?.length, 0);

    // Cleanup
    await db.from("sets").delete().eq("id", concurrentSet!.id);
  },
);

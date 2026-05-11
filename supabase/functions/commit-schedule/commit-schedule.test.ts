// Integration tests for commit-schedule.
// Run against a local Supabase instance: deno test --allow-env --allow-net commit-schedule.test.ts
//
// These tests require SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
// They test the commit_schedule RPC directly, which is the meaningful logic layer.
// The Edge Function itself is a thin auth + dispatch wrapper.

import { assertEquals, assertExists } from "jsr:@std/assert@1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function skipIfNoEnv() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.warn(
      "Skipping integration tests: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set",
    );
    return true;
  }
  return false;
}

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

Deno.test("commit_schedule: creates new artist and set", async () => {
  if (skipIfNoEnv()) return;
  const db = adminClient();
  const editionId = await getTestEditionId(db);
  const userId = await getTestUserId(db);
  const slug = `test-artist-${Date.now()}`;
  const setName = `Test Artist Set ${slug}`;

  const { data, error } = await db.rpc("commit_schedule", {
    p_festival_edition_id: editionId,
    p_user_id: userId,
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
    if (skipIfNoEnv()) return;
    const db = adminClient();
    const editionId = await getTestEditionId(db);
    const userId = await getTestUserId(db);
    const slug = `test-update-artist-${Date.now()}`;

    // Create artist and set
    await db.from("artists").insert({ name: "Update Test", slug });
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
  if (skipIfNoEnv()) return;
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
  "commit_schedule: midnight-crossing times stored correctly",
  async () => {
    if (skipIfNoEnv()) return;
    const db = adminClient();
    const editionId = await getTestEditionId(db);
    const userId = await getTestUserId(db);
    const slug = `test-midnight-${Date.now()}`;

    await db.from("artists").insert({ name: "Late Night DJ", slug });

    const { error } = await db.rpc("commit_schedule", {
      p_festival_edition_id: editionId,
      p_user_id: userId,
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

import { describe, expect, it } from "vitest";
import { createSet } from "./useCreateSet";
import { updateSet } from "./useUpdateSet";
import { registerCleanup, testSupabase } from "@/test/integration/harness";
import { signInAsTestUser } from "@/test/integration/fixtures/auth";
import { createScratchFestivalEdition } from "@/test/integration/fixtures/scratchPool";

async function createSetThroughApi(
  overrides: Partial<Parameters<typeof createSet>[0]> = {},
) {
  const userId = await signInAsTestUser();
  const editionId = await createScratchFestivalEdition();

  const set = await createSet({
    name: `API Scratch Set ${crypto.randomUUID()}`,
    description: null,
    festival_edition_id: editionId,
    stage_id: null,
    time_start: null,
    time_end: null,
    created_by: userId,
    ...overrides,
  });

  registerCleanup(async () => {
    const { error } = await testSupabase.from("sets").delete().eq("id", set.id);
    if (error) throw error;
  });

  return set;
}

describe("createSet / updateSet", () => {
  it("persists set_type and external_url through the create mutation", async () => {
    const set = await createSetThroughApi({
      set_type: "workshop",
      external_url: "https://example.com/workshop",
    });

    const { data, error } = await testSupabase
      .from("sets")
      .select("set_type, external_url")
      .eq("id", set.id)
      .single();

    expect(error).toBeNull();
    expect(data?.set_type).toBe("workshop");
    expect(data?.external_url).toBe("https://example.com/workshop");
  });

  it("defaults both fields to null when the create input omits them", async () => {
    const set = await createSetThroughApi();

    const { data, error } = await testSupabase
      .from("sets")
      .select("set_type, external_url")
      .eq("id", set.id)
      .single();

    expect(error).toBeNull();
    expect(data?.set_type).toBeNull();
    expect(data?.external_url).toBeNull();
  });

  it("persists set_type and external_url through the update mutation", async () => {
    const set = await createSetThroughApi();

    await updateSet({
      id: set.id,
      updates: {
        set_type: "performance",
        external_url: "https://example.com/performance",
      },
    });

    const { data, error } = await testSupabase
      .from("sets")
      .select("set_type, external_url")
      .eq("id", set.id)
      .single();

    expect(error).toBeNull();
    expect(data?.set_type).toBe("performance");
    expect(data?.external_url).toBe("https://example.com/performance");
  });

  it("can clear both fields back to null through the update mutation", async () => {
    const set = await createSetThroughApi({
      set_type: "other",
      external_url: "https://example.com/other",
    });

    await updateSet({
      id: set.id,
      updates: { set_type: null, external_url: null },
    });

    const { data, error } = await testSupabase
      .from("sets")
      .select("set_type, external_url")
      .eq("id", set.id)
      .single();

    expect(error).toBeNull();
    expect(data?.set_type).toBeNull();
    expect(data?.external_url).toBeNull();
  });
});

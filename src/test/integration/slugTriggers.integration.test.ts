import { describe, expect, it } from "vitest";
import { registerCleanup, testSupabase } from "./harness";
import { signInAsTestUser } from "./fixtures/auth";
import { createFestival } from "./fixtures/festivals";
import { createScratchFestivalEdition } from "./fixtures/scratchPool";

// Callers send slug: "" to mean "derive it"; the columns are NOT NULL, so the
// BEFORE INSERT trigger is what fills it in.
describe("slug dedupe triggers", () => {
  describe("groups (scoped per creator)", () => {
    it("derives a slug from the name and dedupes a collision", async () => {
      const userId = await signInAsTestUser();
      const name = `Slug Group ${crypto.randomUUID()}`;

      const first = await insertGroup(userId, name);
      const second = await insertGroup(userId, name);

      expect(first).toMatch(/^slug-group-[0-9a-f-]+$/);
      expect(second).toBe(`${first}-2`);
    });

    it("lets different creators share the same slug", async () => {
      const userA = await signInAsTestUser();
      const userB = await signInAsTestUser();
      const name = `Slug Group ${crypto.randomUUID()}`;

      const a = await insertGroup(userA, name);
      const b = await insertGroup(userB, name);

      expect(b).toBe(a);
    });

    it("keeps an explicit slug", async () => {
      const userId = await signInAsTestUser();
      const slug = `custom-${crypto.randomUUID()}`;

      expect(await insertGroup(userId, "Whatever", slug)).toBe(slug);
    });

    it("serializes concurrent inserts whose bases overlap after suffixing", async () => {
      const userId = await signInAsTestUser();
      const id = crypto.randomUUID();
      await insertGroup(userId, `Crew ${id}`);

      // `crew-<id>` is taken, so the first resolves to `crew-<id>-2`; the
      // second's own base is already `crew-<id>-2`.
      const slugs = await Promise.all([
        insertGroup(userId, `Crew ${id}`),
        insertGroup(userId, `Crew ${id} 2`),
      ]);

      expect(new Set(slugs).size).toBe(2);
    });

    it("rejects an explicit slug that is already taken instead of renaming it", async () => {
      const userId = await signInAsTestUser();
      const slug = `custom-${crypto.randomUUID()}`;
      await insertGroup(userId, "First", slug);

      await expect(insertGroup(userId, "Second", slug)).rejects.toMatchObject({
        code: "23505",
      });
    });

    it("gives a non-Latin name a non-empty slug", async () => {
      const userId = await signInAsTestUser();

      const slug = await insertGroup(userId, "כנסיית השכל");

      expect(slug).toMatch(/^n-[0-9a-f]{8}/);
    });
  });

  describe("stages (scoped per edition)", () => {
    it("derives a slug from the name and dedupes a collision", async () => {
      const editionId = await createScratchFestivalEdition();

      // Stage names are unique per edition, so collide on the slug via a
      // differently-punctuated name.
      const first = await insertStage(editionId, "Main Stage");
      const second = await insertStage(editionId, "Main-Stage");
      const otherEdition = await insertStage(
        await createScratchFestivalEdition(),
        "Main Stage",
      );

      expect(first).toBe("main-stage");
      expect(second).toBe("main-stage-2");
      expect(otherEdition).toBe("main-stage");
    });

    it("keeps an explicit slug", async () => {
      const editionId = await createScratchFestivalEdition();

      expect(await insertStage(editionId, "Main Stage", "the-big-one")).toBe(
        "the-big-one",
      );
    });
  });

  describe("festivals (globally unique)", () => {
    it("derives a slug from the name and dedupes a collision", async () => {
      const name = `Slug Festival ${crypto.randomUUID()}`;

      const first = await createFestival({ name, slug: "" });
      const second = await createFestival({ name, slug: "" });

      expect(first.slug).toMatch(/^slug-festival-[0-9a-f-]+$/);
      expect(second.slug).toBe(`${first.slug}-2`);
    });

    it("keeps an explicit slug", async () => {
      const slug = `custom-${crypto.randomUUID()}`;

      const festival = await createFestival({ slug });

      expect(festival.slug).toBe(slug);
    });
  });

  describe("festival editions (scoped per festival)", () => {
    it("derives a slug from the name and dedupes a collision", async () => {
      const festival = await createFestival();

      const first = await insertEdition(festival.id, "Edition One");
      const second = await insertEdition(festival.id, "Edition One");
      const otherFestival = await insertEdition(
        (await createFestival()).id,
        "Edition One",
      );

      expect(first).toBe("edition-one");
      expect(second).toBe("edition-one-2");
      expect(otherFestival).toBe("edition-one");
    });

    it("keeps an explicit slug", async () => {
      const festival = await createFestival();

      expect(await insertEdition(festival.id, "Edition One", "2099")).toBe(
        "2099",
      );
    });
  });
});

async function insertGroup(createdBy: string, name: string, slug = "") {
  const { data, error } = await testSupabase
    .from("groups")
    .insert({ name, slug, created_by: createdBy })
    .select("id, slug")
    .single();
  if (error) throw error;

  registerCleanup(async () => {
    const { error: deleteError } = await testSupabase
      .from("groups")
      .delete()
      .eq("id", data.id);
    if (deleteError) throw deleteError;
  });

  return data.slug;
}

async function insertStage(editionId: string, name: string, slug = "") {
  const { data, error } = await testSupabase
    .from("stages")
    .insert({ name, slug, festival_edition_id: editionId })
    .select("id, slug")
    .single();
  if (error) throw error;

  registerCleanup(async () => {
    const { error: deleteError } = await testSupabase
      .from("stages")
      .delete()
      .eq("id", data.id);
    if (deleteError) throw deleteError;
  });

  return data.slug;
}

async function insertEdition(festivalId: string, name: string, slug = "") {
  const { data, error } = await testSupabase
    .from("festival_editions")
    .insert({ festival_id: festivalId, name, slug, year: 2099 })
    .select("id, slug")
    .single();
  if (error) throw error;

  registerCleanup(async () => {
    const { error: deleteError } = await testSupabase
      .from("festival_editions")
      .delete()
      .eq("id", data.id);
    if (deleteError) throw deleteError;
  });

  return data.slug;
}

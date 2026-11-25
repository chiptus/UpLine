import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/test/withTestQuery";
import { editionSlugTakenQuery } from "./editions/useEditionSlugTaken";
import { festivalSlugTakenQuery } from "./festivals/useFestivalSlugTaken";

const from = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (table: string) => from(table) },
}));

describe("festival and edition slug availability", () => {
  beforeEach(() => from.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("checks festival slugs globally and excludes the festival being edited", async () => {
    const lookup = mockCount(1);
    const client = createTestQueryClient();

    await expect(
      client.fetchQuery(
        festivalSlugTakenQuery({
          slug: "boom",
          excludeFestivalId: "festival-1",
        }),
      ),
    ).resolves.toBe(true);

    expect(from).toHaveBeenCalledWith("festivals");
    expect(lookup.select).toHaveBeenCalledWith("id", {
      count: "exact",
      head: true,
    });
    expect(lookup.eq.mock.calls).toEqual([["slug", "boom"]]);
    expect(lookup.neq).toHaveBeenCalledWith("id", "festival-1");
    expect(lookup.abortSignal).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it("checks edition slugs within the parent festival and excludes the edition being edited", async () => {
    const lookup = mockCount(0);
    const client = createTestQueryClient();

    await expect(
      client.fetchQuery(
        editionSlugTakenQuery({
          festivalId: "festival-1",
          slug: "summer",
          excludeEditionId: "edition-1",
        }),
      ),
    ).resolves.toBe(false);

    expect(from).toHaveBeenCalledWith("festival_editions");
    expect(lookup.select).toHaveBeenCalledWith("id", {
      count: "exact",
      head: true,
    });
    expect(lookup.eq.mock.calls).toEqual(
      expect.arrayContaining([
        ["festival_id", "festival-1"],
        ["slug", "summer"],
      ]),
    );
    expect(lookup.neq).toHaveBeenCalledWith("id", "edition-1");
    expect(lookup.abortSignal).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it("keeps a taken result out of the cache for other candidates, parents, and excluded editions", () => {
    const client = createTestQueryClient();
    const params = {
      festivalId: "festival-1",
      slug: "summer",
      excludeEditionId: "edition-1",
    };

    client.setQueryData(editionSlugTakenQuery(params).queryKey, true);

    expect(
      client.getQueryData(editionSlugTakenQuery({ ...params }).queryKey),
    ).toBe(true);
    for (const change of [
      { festivalId: "festival-2" },
      { slug: "winter" },
      { excludeEditionId: "edition-2" },
    ]) {
      expect(
        client.getQueryData(
          editionSlugTakenQuery({ ...params, ...change }).queryKey,
        ),
      ).toBeUndefined();
    }
  });

  describe.each([
    {
      entity: "festival",
      fetchAvailability() {
        return createTestQueryClient().fetchQuery(
          festivalSlugTakenQuery({
            slug: "boom",
            excludeFestivalId: "festival-1",
          }),
        );
      },
    },
    {
      entity: "edition",
      fetchAvailability() {
        return createTestQueryClient().fetchQuery(
          editionSlugTakenQuery({
            festivalId: "festival-1",
            slug: "summer",
            excludeEditionId: "edition-1",
          }),
        );
      },
    },
  ])("$entity lookup", ({ fetchAvailability }) => {
    it.each([
      { count: 2, taken: true },
      { count: 0, taken: false },
      { count: null, taken: false },
    ])("returns $taken when the count is $count", async ({ count, taken }) => {
      mockCount(count);

      await expect(fetchAvailability()).resolves.toBe(taken);
    });

    it("rejects a failed lookup instead of reporting the slug as available", async () => {
      mockCount(null, { message: "Database unavailable" });
      vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(fetchAvailability()).rejects.toThrow(
        "Failed to check slug availability",
      );
    });
  });
});

function mockCount(
  count: number | null,
  error: { message: string } | null = null,
) {
  const filters = {
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockResolvedValue({ count, error }),
  };
  const select = vi.fn().mockReturnValue(filters);
  from.mockReturnValue({ select });
  return { select, ...filters };
}

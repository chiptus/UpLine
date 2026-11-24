import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateSet } from "./sets/useUpdateSet";

const update = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      update: (data: unknown) => {
        update(data);
        return {
          eq: () => ({
            select: () => ({
              single: () =>
                Promise.resolve({ data: { id: "s1" }, error: null }),
            }),
          }),
        };
      },
    }),
  },
}));

describe("updateSet slug handling", () => {
  beforeEach(() => update.mockReset());

  it("leaves the slug out of a rename", async () => {
    await updateSet({ id: "s1", updates: { name: "Renamed" } });

    expect(update).toHaveBeenCalledWith({ name: "Renamed" });
  });

  it("sends an explicit slug edit", async () => {
    await updateSet({ id: "s1", updates: { slug: "custom" } });

    expect(update).toHaveBeenCalledWith({ slug: "custom" });
  });
});

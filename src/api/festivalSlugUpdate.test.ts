import { Fragment } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SlugConflictError } from "@/lib/slug";
import { withTestQuery } from "@/test/withTestQuery";
import { useUpdateFestivalEditionMutation } from "./editions/useUpdateFestivalEdition";
import { useUpdateFestivalMutation } from "./festivals/useUpdateFestival";

const single = vi.fn();
const toast = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      update: () => ({ eq: () => ({ select: () => ({ single }) }) }),
    }),
  },
}));
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast }),
}));

describe.each([
  {
    entity: "festival",
    slugConstraint: "festivals_slug_unique",
    genericMessage: "Failed to update festival",
    useSave: useSaveFestival,
  },
  {
    entity: "edition",
    slugConstraint: "festival_editions_slug_festival_unique",
    genericMessage: "Failed to update festival edition",
    useSave: useSaveEdition,
  },
])("$entity slug update", ({ slugConstraint, genericMessage, useSave }) => {
  beforeEach(() => {
    single.mockReset();
    toast.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("reports a slug conflict when the database rejects an update", async () => {
    single.mockResolvedValue({
      data: null,
      error: uniqueViolation(slugConstraint),
    });
    const { result } = renderHook(useSave, {
      wrapper: withTestQuery(Fragment),
    });

    await act(async () => {
      await expect(result.current()).rejects.toBeInstanceOf(SlugConflictError);
    });
    expect(toast).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        description: "That slug is already in use",
        variant: "destructive",
      }),
    );
  });

  it("keeps the generic update error for a non-slug unique violation", async () => {
    const error = uniqueViolation("another_column_unique");
    single.mockResolvedValue({ data: null, error });
    const { result } = renderHook(useSave, {
      wrapper: withTestQuery(Fragment),
    });

    await act(async () => {
      await expect(result.current()).rejects.toBe(error);
    });
    expect(toast).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        description: genericMessage,
        variant: "destructive",
      }),
    );
  });
});

function useSaveFestival(): () => Promise<unknown> {
  const { mutateAsync } = useUpdateFestivalMutation();
  return () =>
    mutateAsync({ festivalId: "festival-1", festivalData: { slug: "taken" } });
}

function useSaveEdition(): () => Promise<unknown> {
  const { mutateAsync } = useUpdateFestivalEditionMutation();
  return () =>
    mutateAsync({ editionId: "edition-1", editionData: { slug: "taken" } });
}

function uniqueViolation(constraint: string) {
  return {
    code: "23505",
    message: `duplicate key value violates unique constraint "${constraint}"`,
  };
}

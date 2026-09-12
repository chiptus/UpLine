import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FestivalEditionManagement } from "./FestivalEditionManagement";
import type { Festival } from "@/api/festivals/types";

const mutateCreate = vi.fn();
const mutateUpdate = vi.fn();
const toastMock = vi.fn();

const festival = { id: "festival-1", name: "Boom" } as Festival;

vi.mock("@/api/festivals/useFestivalBySlug", () => ({
  useFestivalBySlugQuery: () => ({ data: festival, isLoading: false }),
}));

vi.mock("@/api/editions/useFestivalEditionsForFestival", () => ({
  useFestivalEditionsForFestivalQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/api/editions/useCreateFestivalEdition", () => ({
  useCreateFestivalEditionMutation: () => ({
    mutate: mutateCreate,
    isPending: false,
  }),
}));

vi.mock("@/api/editions/useUpdateFestivalEdition", () => ({
  useUpdateFestivalEditionMutation: () => ({
    mutate: mutateUpdate,
    isPending: false,
  }),
}));

vi.mock("@/api/editions/useDeleteFestivalEdition", () => ({
  useDeleteFestivalEditionMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

describe("FestivalEditionManagement", () => {
  beforeEach(() => {
    mutateCreate.mockReset();
    mutateUpdate.mockReset();
    toastMock.mockReset();
  });

  it("creates a new edition via mutate() and only closes the dialog on success", async () => {
    render(
      <FestivalEditionManagement
        festivalSlug="boom"
        onSelect={vi.fn()}
        selected=""
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Add Edition" }));
    await userEvent.type(screen.getByLabelText("Edition Name"), "Boom 2027");

    const dialog = screen.getByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Create" }),
    );

    expect(mutateUpdate).not.toHaveBeenCalled();
    expect(mutateCreate).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        name: "Boom 2027",
        festival_id: "festival-1",
      }),
      { onSuccess: expect.any(Function) },
    );
    expect(mutateCreate.mock.calls[0][1]).not.toHaveProperty("onError");

    // The dialog stays open until the mutation actually succeeds.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    act(() => mutateCreate.mock.calls[0][1].onSuccess());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not call the mutation when the edition name is blank", () => {
    render(
      <FestivalEditionManagement
        festivalSlug="boom"
        onSelect={vi.fn()}
        selected=""
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add Edition" }));
    fireEvent.submit(document.querySelector("form")!);

    expect(mutateCreate).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ description: "Edition name is required" }),
    );
  });
});

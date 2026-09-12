import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FestivalDialog } from "./FestivalDialog";
import type { Festival } from "@/api/festivals/types";

const mutateCreate = vi.fn();
const mutateUpdate = vi.fn();
const toastMock = vi.fn();
let createPending = false;
let updatePending = false;

vi.mock("@/api/festivals/useCreateFestival", () => ({
  useCreateFestivalMutation: () => ({
    mutate: mutateCreate,
    isPending: createPending,
  }),
}));

vi.mock("@/api/festivals/useUpdateFestival", () => ({
  useUpdateFestivalMutation: () => ({
    mutate: mutateUpdate,
    isPending: updatePending,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

function makeFestival(overrides: Partial<Festival> = {}): Festival {
  return {
    id: "festival-1",
    name: "Boom Festival",
    slug: "boom-festival",
    description: "",
    published: false,
    timezone: "Europe/Lisbon",
    logo_url: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as Festival;
}

describe("FestivalDialog", () => {
  beforeEach(() => {
    mutateCreate.mockReset();
    mutateUpdate.mockReset();
    toastMock.mockReset();
    createPending = false;
    updatePending = false;
  });

  it("creates a new festival via mutate() and closes the dialog on success", async () => {
    const onOpenChange = vi.fn();
    render(
      <FestivalDialog
        open
        onOpenChange={onOpenChange}
        editingFestival={null}
      />,
    );

    await userEvent.type(
      screen.getByLabelText("Festival Name"),
      "Boom Festival",
    );
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(mutateUpdate).not.toHaveBeenCalled();
    expect(mutateCreate).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ name: "Boom Festival", slug: "boom-festival" }),
      { onSuccess: expect.any(Function) },
    );
    expect(onOpenChange).not.toHaveBeenCalled();

    // The dialog only closes once the mutation actually succeeds.
    mutateCreate.mock.calls[0][1].onSuccess();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("updates the editing festival via mutate() without a local onError toast", async () => {
    const onOpenChange = vi.fn();
    const editingFestival = makeFestival();
    render(
      <FestivalDialog
        open
        onOpenChange={onOpenChange}
        editingFestival={editingFestival}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Update" }));

    expect(mutateCreate).not.toHaveBeenCalled();
    expect(mutateUpdate).toHaveBeenCalledExactlyOnceWith(
      {
        festivalId: editingFestival.id,
        festivalData: expect.objectContaining({ name: "Boom Festival" }),
      },
      { onSuccess: expect.any(Function) },
    );

    // No onError is wired up — useUpdateFestivalMutation already toasts on
    // failure, so the dialog must not close or throw if the mutation rejects.
    expect(mutateUpdate.mock.calls[0][1]).not.toHaveProperty("onError");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("does not call the mutation when the name is blank", () => {
    // The name/slug inputs are also HTML5 `required`, which blocks a real
    // click-triggered submit before our validation runs — dispatch the
    // submit event directly to exercise handleSubmit's own guard.
    render(
      <FestivalDialog open onOpenChange={vi.fn()} editingFestival={null} />,
    );

    // Dialog content renders into a portal on document.body, not `container`.
    fireEvent.submit(document.querySelector("form")!);

    expect(mutateCreate).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ description: "Festival name is required" }),
    );
  });

  it("disables the submit button while either mutation is pending", () => {
    createPending = true;
    render(
      <FestivalDialog open onOpenChange={vi.fn()} editingFestival={null} />,
    );

    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });
});

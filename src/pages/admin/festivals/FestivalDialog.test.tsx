import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FestivalDialog } from "./FestivalDialog";
import type { Festival } from "@/api/festivals/types";

const createMutate = vi.fn();
const updateMutate = vi.fn();

vi.mock("@/api/festivals/useCreateFestival", () => ({
  useCreateFestivalMutation: () => ({ mutate: createMutate, isPending: false }),
}));
vi.mock("@/api/festivals/useUpdateFestival", () => ({
  useUpdateFestivalMutation: () => ({ mutate: updateMutate, isPending: false }),
}));
vi.mock("@/components/Admin/ScheduleImport/TimezonePicker", () => ({
  TimezonePicker: ({ value }: { value: string }) => (
    <div data-testid="timezone">{value}</div>
  ),
}));

describe("FestivalDialog", () => {
  beforeEach(() => {
    // Radix Switch measures its thumb; jsdom has no ResizeObserver.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    createMutate.mockReset();
    updateMutate.mockReset();
  });

  it("blocks submit with field errors for an empty name and slug", async () => {
    renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByText("Festival name is required"),
    ).toBeInTheDocument();
    expect(screen.getByText("Festival slug is required")).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("derives the slug from the name until the slug is edited directly", async () => {
    renderDialog();
    const name = screen.getByLabelText("Festival Name");
    const slug = screen.getByLabelText("URL Slug");

    await userEvent.type(name, "Boom Fest");
    expect(slug).toHaveValue("boom-fest");

    await userEvent.clear(slug);
    await userEvent.type(slug, "custom");
    await userEvent.type(name, "ival");

    expect(slug).toHaveValue("custom");
  });

  it("submits the create payload and closes on success", async () => {
    const onOpenChange = vi.fn();
    createMutate.mockImplementation((_vars, options) => options.onSuccess());
    renderDialog({ onOpenChange });

    await userEvent.type(screen.getByLabelText("Festival Name"), "Boom Fest");
    await userEvent.type(screen.getByLabelText("Description"), "Psy");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    expect(createMutate.mock.calls[0][0]).toEqual({
      name: "Boom Fest",
      slug: "boom-fest",
      description: "Psy",
      published: false,
      timezone: "Europe/Lisbon",
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("pre-fills saved values when editing and submits the update payload", async () => {
    renderDialog({ editingFestival: festival });

    expect(screen.getByLabelText("Festival Name")).toHaveValue("Old Name");
    expect(screen.getByLabelText("URL Slug")).toHaveValue("old-slug");
    expect(screen.getByLabelText("Description")).toHaveValue("Old desc");
    expect(screen.getByTestId("timezone")).toHaveTextContent("Asia/Tokyo");

    const name = screen.getByLabelText("Festival Name");
    await userEvent.clear(name);
    await userEvent.type(name, "New Name");
    await userEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalled());
    expect(updateMutate.mock.calls[0][0]).toEqual({
      festivalId: "f1",
      festivalData: {
        name: "New Name",
        slug: "old-slug",
        description: "Old desc",
        published: true,
        timezone: "Asia/Tokyo",
      },
    });
  });

  it("resets the form when the dialog is reopened", async () => {
    const { rerender } = renderDialog();
    await userEvent.type(screen.getByLabelText("Festival Name"), "Draft");

    rerender(
      <FestivalDialog
        open={false}
        onOpenChange={vi.fn()}
        editingFestival={null}
      />,
    );
    rerender(
      <FestivalDialog open onOpenChange={vi.fn()} editingFestival={null} />,
    );

    expect(screen.getByLabelText("Festival Name")).toHaveValue("");
    expect(screen.getByLabelText("URL Slug")).toHaveValue("");
  });
});

const festival = {
  id: "f1",
  name: "Old Name",
  slug: "old-slug",
  description: "Old desc",
  published: true,
  timezone: "Asia/Tokyo",
} as Festival;

function renderDialog(
  props: Partial<React.ComponentProps<typeof FestivalDialog>> = {},
) {
  return render(
    <FestivalDialog
      open
      onOpenChange={vi.fn()}
      editingFestival={null}
      {...props}
    />,
  );
}

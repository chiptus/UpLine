import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FestivalDialog } from "./FestivalDialog";

const createMutate = vi.fn();

vi.mock("@/api/festivals/useCreateFestival", () => ({
  useCreateFestivalMutation: () => ({ mutate: createMutate, isPending: false }),
}));
vi.mock("@/api/festivals/useUpdateFestival", () => ({
  useUpdateFestivalMutation: () => ({ mutate: vi.fn(), isPending: false }),
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
  });

  it("blocks submit with field errors for an empty name and slug", async () => {
    renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    await expectAlert("Festival name is required");
    await expectAlert("Festival slug is required");
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("derives the slug from the name until the slug is edited directly", async () => {
    renderDialog();
    const name = screen.getByLabelText("Festival Name");
    const slug = screen.getByLabelText("URL Slug");

    await userEvent.type(name, "Boom Fest");
    expect(slug).toHaveValue("boom-fest");

    await userEvent.clear(slug);
    await userEvent.click(slug);
    await userEvent.paste("My Custom Slug!");
    expect(slug).toHaveValue("my-custom-slug");

    await userEvent.type(name, "ival");

    expect(slug).toHaveValue("my-custom-slug");
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

/** role="alert" has no name-from-content, so match on text within the alerts. */
async function expectAlert(message: string) {
  const alerts = await screen.findAllByRole("alert");
  expect(alerts.map((alert) => alert.textContent)).toContain(message);
}

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

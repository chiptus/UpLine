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
vi.mock("@/api/festivals/useFestivalSlugTaken", () => ({
  useFestivalSlugTakenQuery: () => ({ data: false }),
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

  it("blocks submit when the day end hour is outside 0-23", async () => {
    renderDialog();
    await userEvent.type(screen.getByLabelText("Festival Name"), "Boom Fest");
    const dayEndHour = screen.getByLabelText("Day end hour");
    await userEvent.clear(dayEndHour);
    await userEvent.type(dayEndHour, "24");

    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    await expectAlert("Hour must be between 0 and 23");
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
    await userEvent.paste("my-custom-slug");
    expect(slug).toHaveValue("my-custom-slug");

    await userEvent.type(name, "ival");

    expect(slug).toHaveValue("my-custom-slug");
  });

  it("keeps what the user types, flags an invalid slug and offers to slugify it", async () => {
    renderDialog();
    const slug = screen.getByLabelText("URL Slug");

    await userEvent.type(slug, "My Slug!");

    expect(slug).toHaveValue("My Slug!");
    await expectAlert("Use only lowercase letters, numbers, and hyphens");

    await userEvent.click(screen.getByRole("button", { name: "Slugify" }));

    expect(slug).toHaveValue("my-slug");
    expect(screen.queryByRole("button", { name: "Slugify" })).toBeNull();
  });

  it("explains a trailing or doubled hyphen specifically", async () => {
    renderDialog();
    const slug = screen.getByLabelText("URL Slug");

    await userEvent.type(slug, "boom-");
    await expectAlert("Slug can't start or end with a hyphen");

    await userEvent.type(slug, "-fest");
    await expectAlert("Slug can't contain two hyphens in a row");
  });

  it("lets a hyphen be typed mid-slug", async () => {
    renderDialog();
    const slug = screen.getByLabelText("URL Slug");

    await userEvent.type(slug, "boom-festival");

    expect(slug).toHaveValue("boom-festival");
    expect(screen.queryByRole("button", { name: "Slugify" })).toBeNull();
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

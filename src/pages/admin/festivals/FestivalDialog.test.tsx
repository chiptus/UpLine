import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Festival } from "@/api/festivals/types";
import { FestivalDialog } from "./FestivalDialog";

const createMutate = vi.fn();
const updateMutate = vi.fn();
const useFestivalSlugTakenQuery = vi.fn();

vi.mock("@/api/festivals/useCreateFestival", () => ({
  useCreateFestivalMutation: () => ({ mutate: createMutate, isPending: false }),
}));
vi.mock("@/api/festivals/useUpdateFestival", () => ({
  useUpdateFestivalMutation: () => ({ mutate: updateMutate, isPending: false }),
}));
vi.mock("@/api/festivals/useFestivalSlugTaken", () => ({
  useFestivalSlugTakenQuery: (...args: unknown[]) =>
    useFestivalSlugTakenQuery(...args),
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
    useFestivalSlugTakenQuery.mockReset().mockReturnValue({ data: false });
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

  it("saves an unchanged festival slug without checking availability", async () => {
    useFestivalSlugTakenQuery.mockReturnValue({ data: true });
    renderDialog({ editingFestival: makeFestival() });

    await userEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() =>
      expect(updateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          festivalId: "festival-1",
          festivalData: expect.objectContaining({ slug: "boom-fest" }),
        }),
        expect.anything(),
      ),
    );
    expect(useFestivalSlugTakenQuery).not.toHaveBeenCalledWith(
      expect.anything(),
      { enabled: true },
    );
    expect(
      screen.queryByText("That slug is already in use"),
    ).not.toBeInTheDocument();
  });

  it("does not check availability when creating a festival with a valid slug", async () => {
    useFestivalSlugTakenQuery.mockReturnValue({ data: true });
    renderDialog();

    await userEvent.type(screen.getByLabelText("Festival Name"), "Boom Fest");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(useFestivalSlugTakenQuery).not.toHaveBeenCalledWith(
      expect.anything(),
      { enabled: true },
    );
  });

  it("keeps an invalid slug as typed, slugifies on request, then blocks a collision until the user recovers", async () => {
    useFestivalSlugTakenQuery.mockImplementation(
      ({ slug }: { slug: string }, { enabled }: { enabled: boolean }) => ({
        data: enabled && slug === "taken",
      }),
    );
    renderDialog({ editingFestival: makeFestival() });
    const slug = screen.getByRole<HTMLInputElement>("textbox", {
      name: "URL Slug",
    });
    const update = screen.getByRole("button", { name: "Update" });
    const regenerate = screen.getByRole("button", {
      name: "Regenerate slug from name",
    });

    expect(regenerate).toBeDisabled();
    await userEvent.clear(slug);
    await userEvent.type(slug, "Taken-");
    expect(slug).toHaveValue("Taken-");
    expect(slug).toHaveAccessibleDescription(/Use only lowercase letters/);

    await userEvent.tab();
    expect(slug).toHaveValue("Taken-");

    await userEvent.click(screen.getByRole("button", { name: "Slugify" }));
    expect(slug).toHaveValue("taken");
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("That slug is already in use");
    expect(slug).toHaveAttribute("aria-invalid", "true");
    expect(slug).toHaveAccessibleDescription(
      /This will be used in the URL:.*That slug is already in use/,
    );
    expect(useFestivalSlugTakenQuery).toHaveBeenLastCalledWith(
      { slug: "taken", excludeFestivalId: "festival-1" },
      { enabled: true },
    );
    expect(update).toBeDisabled();

    await userEvent.type(slug, "{Enter}");
    expect(updateMutate).not.toHaveBeenCalled();

    await userEvent.click(regenerate);
    expect(slug).toHaveValue("boom-fest");
    expect(slug).toHaveAttribute("aria-invalid", "false");
    expect(slug).not.toHaveAccessibleDescription(/already in use/);
    expect(alert).not.toBeInTheDocument();
    expect(update).toBeEnabled();
    expect(regenerate).toBeDisabled();
    expect(updateMutate).not.toHaveBeenCalled();
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

function makeFestival(): Festival {
  return {
    id: "festival-1",
    name: "Boom Fest",
    slug: "boom-fest",
    description: null,
    published: false,
    archived: false,
    logo_url: null,
    timezone: "UTC",
    day_end_hour: 6,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  };
}

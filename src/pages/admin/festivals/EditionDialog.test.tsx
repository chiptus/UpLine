import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FestivalEdition } from "@/api/editions/types";
import { EditionDialog } from "./EditionDialog";

const createMutate = vi.fn();
const updateMutate = vi.fn();

vi.mock("@/api/editions/useCreateFestivalEdition", () => ({
  useCreateFestivalEditionMutation: () => ({
    mutate: createMutate,
    isPending: false,
  }),
}));
vi.mock("@/api/editions/useUpdateFestivalEdition", () => ({
  useUpdateFestivalEditionMutation: () => ({
    mutate: updateMutate,
    isPending: false,
  }),
}));

describe("EditionDialog", () => {
  beforeEach(() => {
    // Radix Switch/Select measure elements; jsdom has no ResizeObserver.
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

    await expectAlert("Edition name is required");
    await expectAlert("Edition slug is required");
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("blocks submit when the year is outside 2000-2100", async () => {
    renderDialog();
    await userEvent.type(screen.getByLabelText("Edition Name"), "Boom 2027");
    const year = screen.getByLabelText("Year");
    await userEvent.clear(year);
    await userEvent.type(year, "1999");

    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    await expectAlert("Year must be between 2000 and 2100");
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("derives the slug from the name until the slug is edited directly", async () => {
    renderDialog();
    const name = screen.getByLabelText("Edition Name");
    const slug = screen.getByLabelText("URL Slug");

    await userEvent.type(name, "Boom 2027");
    expect(slug).toHaveValue("boom-2027");

    await userEvent.clear(slug);
    await userEvent.click(slug);
    await userEvent.paste("My Custom Slug!");
    expect(slug).toHaveValue("my-custom-slug");

    await userEvent.type(name, "!");
    expect(slug).toHaveValue("my-custom-slug");
  });

  it("creates an edition with blank dates sent as null", async () => {
    renderDialog();
    await userEvent.type(screen.getByLabelText("Edition Name"), "Boom 2027");

    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    await vi.waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate.mock.calls[0][0]).toMatchObject({
      name: "Boom 2027",
      slug: "boom-2027",
      start_date: null,
      end_date: null,
      published: false,
      schedule_reveal_level: "draft",
      festival_id: "festival-1",
    });
  });

  it("pre-fills an edited edition and updates it", async () => {
    renderDialog({ editingEdition: makeEdition() });

    expect(screen.getByLabelText("Edition Name")).toHaveValue("Boom 2025");
    expect(screen.getByLabelText("URL Slug")).toHaveValue("boom-2025");
    expect(screen.getByLabelText("Year")).toHaveValue(2025);
    expect(screen.getByLabelText("Start Date")).toHaveValue("2025-08-01");

    await userEvent.type(screen.getByLabelText("Edition Name"), " Redux");
    await userEvent.click(screen.getByRole("button", { name: "Update" }));

    await vi.waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0]).toMatchObject({
      editionId: "edition-1",
      editionData: {
        name: "Boom 2025 Redux",
        slug: "boom-2025-redux",
        year: 2025,
        start_date: "2025-08-01",
        end_date: null,
      },
    });
  });

  it("resets the form when the dialog is reopened", async () => {
    const { rerender } = renderDialog();
    await userEvent.type(screen.getByLabelText("Edition Name"), "Draft");

    rerender(dialog({ open: false }));
    rerender(dialog({ open: true }));

    expect(screen.getByLabelText("Edition Name")).toHaveValue("");
    expect(screen.getByLabelText("URL Slug")).toHaveValue("");
  });
});

/** role="alert" has no name-from-content, so match on text within the alerts. */
async function expectAlert(message: string) {
  const alerts = await screen.findAllByRole("alert");
  expect(alerts.map((alert) => alert.textContent)).toContain(message);
}

function makeEdition(): FestivalEdition {
  return {
    id: "edition-1",
    festival_id: "festival-1",
    name: "Boom 2025",
    slug: "boom-2025",
    year: 2025,
    start_date: "2025-08-01",
    end_date: null,
    published: false,
    schedule_reveal_level: "draft",
  } as FestivalEdition;
}

function dialog(props: Partial<React.ComponentProps<typeof EditionDialog>>) {
  return (
    <EditionDialog
      open
      onOpenChange={vi.fn()}
      festivalId="festival-1"
      editingEdition={null}
      {...props}
    />
  );
}

function renderDialog(
  props: Partial<React.ComponentProps<typeof EditionDialog>> = {},
) {
  return render(dialog(props));
}

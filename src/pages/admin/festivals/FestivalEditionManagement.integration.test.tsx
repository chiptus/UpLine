import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FestivalEditionManagement } from "./FestivalEditionManagement";
import {
  renderWithQueryClient,
  testSupabase,
} from "@/test/integration/harness";
import { signInAsTestUser } from "@/test/integration/fixtures/auth";
import { grantAdminRole } from "@/test/integration/fixtures/adminRoles";
import { createFestival } from "@/test/integration/fixtures/festivals";

describe("FestivalEditionManagement", () => {
  it("creates a new edition for real and closes the dialog on success", async () => {
    const userId = await signInAsTestUser();
    await grantAdminRole(userId);
    const festival = await createFestival();

    renderWithQueryClient(
      <FestivalEditionManagement
        festivalSlug={festival.slug}
        onSelect={vi.fn()}
        selected=""
      />,
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "Add Edition" }),
    );
    await userEvent.type(screen.getByLabelText("Edition Name"), "Boom 2027");

    const dialog = screen.getByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Create" }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    const { data, error } = await testSupabase
      .from("festival_editions")
      .select("name")
      .eq("festival_id", festival.id)
      .single();
    expect(error).toBeNull();
    expect(data?.name).toBe("Boom 2027");
  });

  it("keeps the dialog open on a real slug conflict within the same festival", async () => {
    const userId = await signInAsTestUser();
    await grantAdminRole(userId);
    const festival = await createFestival();

    const takenSlug = `taken-${crypto.randomUUID()}`;
    const { error: seedError } = await testSupabase
      .from("festival_editions")
      .insert({
        festival_id: festival.id,
        name: "Existing Edition",
        slug: takenSlug,
        year: 2099,
      });
    if (seedError) throw seedError;

    renderWithQueryClient(
      <FestivalEditionManagement
        festivalSlug={festival.slug}
        onSelect={vi.fn()}
        selected=""
      />,
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "Add Edition" }),
    );
    await userEvent.type(
      screen.getByLabelText("Edition Name"),
      "Conflict Edition",
    );
    const slugInput = screen.getByLabelText("URL Slug");
    await userEvent.clear(slugInput);
    await userEvent.type(slugInput, takenSlug);

    const dialog = screen.getByRole("dialog");
    const submitButton = within(dialog).getByRole("button", {
      name: "Create",
    });
    await userEvent.click(submitButton);

    // useCreateFestivalEditionMutation's own onError toasts the real
    // unique-slug violation; this only asserts the dialog doesn't
    // optimistically close and the mutation settles (no onError wired at
    // the call site — see FestivalEditionManagement.tsx).
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const { data } = await testSupabase
      .from("festival_editions")
      .select("id")
      .eq("festival_id", festival.id)
      .eq("name", "Conflict Edition");
    expect(data ?? []).toHaveLength(0);
  });

  it("does not call the mutation when the edition name is blank", async () => {
    const userId = await signInAsTestUser();
    await grantAdminRole(userId);
    const festival = await createFestival();

    renderWithQueryClient(
      <FestivalEditionManagement
        festivalSlug={festival.slug}
        onSelect={vi.fn()}
        selected=""
      />,
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "Add Edition" }),
    );
    fireEvent.submit(document.querySelector("form")!);

    // There's no success/failure event to wait on here — the assertion is
    // that nothing happens — so give a would-be (wrongly fired) mutation a
    // moment to land before checking no row was created.
    await new Promise((resolve) => setTimeout(resolve, 200));

    const { data } = await testSupabase
      .from("festival_editions")
      .select("id")
      .eq("festival_id", festival.id);
    expect(data ?? []).toHaveLength(0);
  });
});

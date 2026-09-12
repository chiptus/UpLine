import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
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

  it("updates an existing edition for real and closes the dialog on success", async () => {
    const userId = await signInAsTestUser();
    await grantAdminRole(userId);
    const festival = await createFestival();
    const { data: edition, error: seedError } = await testSupabase
      .from("festival_editions")
      .insert({
        festival_id: festival.id,
        name: "Old Edition Name",
        slug: `old-${crypto.randomUUID()}`,
        year: 2025,
      })
      .select("id")
      .single();
    if (seedError) throw seedError;

    renderWithQueryClient(
      <FestivalEditionManagement
        festivalSlug={festival.slug}
        onSelect={vi.fn()}
        selected=""
      />,
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "Edit Old Edition Name" }),
    );

    const dialog = screen.getByRole("dialog");
    const nameInput = within(dialog).getByLabelText("Edition Name");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "New Edition Name");

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Update" }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    const { data, error } = await testSupabase
      .from("festival_editions")
      .select("name")
      .eq("id", edition.id)
      .single();
    expect(error).toBeNull();
    expect(data?.name).toBe("New Edition Name");
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
    // The slug field re-sanitizes its value on every keystroke (stripping
    // trailing hyphens), which corrupts a hyphen-heavy value like this one
    // when typed character-by-character. Pasting sets it in one shot instead.
    const slugInput = screen.getByLabelText("URL Slug");
    await userEvent.clear(slugInput);
    await userEvent.paste(takenSlug);

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

    // handleSubmit's own guard (edition name/slug required, valid slug) runs
    // and returns synchronously before any mutation would be called — the
    // form has `noValidate` specifically so this reaches that guard instead
    // of being blocked by native constraint validation — so there's no
    // async gap to wait out before checking nothing was created.
    const dialog = screen.getByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Create" }),
    );

    const { data } = await testSupabase
      .from("festival_editions")
      .select("id")
      .eq("festival_id", festival.id);
    expect(data ?? []).toHaveLength(0);
  });
});

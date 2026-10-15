import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FestivalDialog } from "./FestivalDialog";
import {
  pasteIntoField,
  registerCleanup,
  renderWithQueryClient,
  testSupabase,
} from "@/test/integration/harness";
import { signInAsTestUser } from "@/test/integration/fixtures/auth";
import { grantAdminRole } from "@/test/integration/fixtures/adminRoles";
import { createFestival } from "@/test/integration/fixtures/festivals";

describe("FestivalDialog", () => {
  it("creates a new festival for real and closes the dialog on success", async () => {
    const userId = await signInAsTestUser();
    await grantAdminRole(userId);

    const slug = `integration-festival-${crypto.randomUUID()}`;
    registerCleanup(async () => {
      const { error } = await testSupabase
        .from("festivals")
        .delete()
        .eq("slug", slug);
      if (error) throw error;
    });

    const onOpenChange = vi.fn();
    renderWithQueryClient(
      <FestivalDialog
        open
        onOpenChange={onOpenChange}
        editingFestival={null}
      />,
    );

    await userEvent.type(
      screen.getByLabelText("Festival Name"),
      "Integration Festival",
    );
    await pasteIntoField("URL Slug", slug);
    await userEvent.type(screen.getByLabelText("Description"), "Psy");
    const dayEndHour = screen.getByLabelText("Day end hour");
    await userEvent.clear(dayEndHour);
    await userEvent.type(dayEndHour, "6");

    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));

    const { data, error } = await testSupabase
      .from("festivals")
      .select("name, slug, description, published, timezone, day_end_hour")
      .eq("slug", slug)
      .single();
    expect(error).toBeNull();
    expect(data).toMatchObject({
      name: "Integration Festival",
      slug,
      description: "Psy",
      published: false,
      timezone: "Europe/Lisbon",
      day_end_hour: 6,
    });
  });

  it("updates an existing festival for real", async () => {
    const userId = await signInAsTestUser();
    await grantAdminRole(userId);
    const festival = await createFestival({
      name: "Old Name",
      description: "Old desc",
      published: true,
      timezone: "Asia/Tokyo",
      day_end_hour: 4,
    });

    const onOpenChange = vi.fn();
    renderWithQueryClient(
      <FestivalDialog
        open
        onOpenChange={onOpenChange}
        editingFestival={festival}
      />,
    );

    expect(screen.getByLabelText("Festival Name")).toHaveValue("Old Name");
    expect(screen.getByLabelText("URL Slug")).toHaveValue(festival.slug);
    expect(screen.getByLabelText("Description")).toHaveValue("Old desc");

    const nameInput = screen.getByLabelText("Festival Name");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "New Name");
    const dayEndHour = screen.getByLabelText("Day end hour");
    await userEvent.clear(dayEndHour);
    await userEvent.type(dayEndHour, "4");

    await userEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));

    const { data, error } = await testSupabase
      .from("festivals")
      .select("name, slug, description, published, timezone, day_end_hour")
      .eq("id", festival.id)
      .single();
    expect(error).toBeNull();
    expect(data).toMatchObject({
      name: "New Name",
      slug: festival.slug,
      description: "Old desc",
      published: true,
      timezone: "Asia/Tokyo",
      day_end_hour: 4,
    });
  });

  it("keeps the dialog open and re-enables submit on a real slug conflict", async () => {
    const userId = await signInAsTestUser();
    await grantAdminRole(userId);
    const taken = await createFestival();
    const festival = await createFestival();

    const onOpenChange = vi.fn();
    renderWithQueryClient(
      <FestivalDialog
        open
        onOpenChange={onOpenChange}
        editingFestival={festival}
      />,
    );

    await pasteIntoField("URL Slug", taken.slug);

    const submitButton = screen.getByRole("button", { name: "Update" });
    await userEvent.click(submitButton);

    // useUpdateFestivalMutation's own onError toasts the real unique-slug
    // violation; this only asserts the dialog doesn't optimistically close
    // and the mutation actually settles (no onError wired at the call site
    // — see FestivalDialog.tsx).
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    expect(onOpenChange).not.toHaveBeenCalled();

    const { data } = await testSupabase
      .from("festivals")
      .select("slug")
      .eq("id", festival.id)
      .single();
    expect(data?.slug).toBe(festival.slug);
  });

  it("does not call the mutation when the name is blank", async () => {
    const userId = await signInAsTestUser();
    await grantAdminRole(userId);

    const before = await testSupabase
      .from("festivals")
      .select("id", { count: "exact", head: true });

    renderWithQueryClient(
      <FestivalDialog open onOpenChange={vi.fn()} editingFestival={null} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    const after = await testSupabase
      .from("festivals")
      .select("id", { count: "exact", head: true });
    expect(after.count).toBe(before.count);
  });
});

import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddArtistDialog } from "./AddArtistDialog";
import { AuthProvider } from "@/contexts/AuthContext";
import {
  renderWithQueryClient,
  testSupabase,
} from "@/test/integration/harness";
import { signInAsTestUser } from "@/test/integration/fixtures/auth";
import { grantAdminRole } from "@/test/integration/fixtures/adminRoles";

describe("AddArtistDialog", () => {
  it("creates the artist for real and calls onSuccess", async () => {
    const userId = await signInAsTestUser();
    await grantAdminRole(userId);

    const onSuccess = vi.fn();
    const name = `Integration Collective ${crypto.randomUUID()}`;
    renderWithQueryClient(
      <AuthProvider>
        <AddArtistDialog open onOpenChange={vi.fn()} onSuccess={onSuccess} />
      </AuthProvider>,
    );

    await userEvent.type(
      await screen.findByPlaceholderText("Enter artist name"),
      name,
    );
    await userEvent.click(screen.getByRole("button", { name: "Add Artist" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());

    const { data, error } = await testSupabase
      .from("artists")
      .select("name, added_by")
      .eq("name", name)
      .single();
    expect(error).toBeNull();
    expect(data?.added_by).toBe(userId);

    await testSupabase.from("artists").delete().eq("name", name);
  });

  it("does not create an artist without edit_artists permission", async () => {
    await signInAsTestUser();
    // No grantAdminRole() — can_edit_artists() is false for this user.

    const onSuccess = vi.fn();
    const name = `Denied Collective ${crypto.randomUUID()}`;
    renderWithQueryClient(
      <AuthProvider>
        <AddArtistDialog open onOpenChange={vi.fn()} onSuccess={onSuccess} />
      </AuthProvider>,
    );

    await userEvent.type(
      await screen.findByPlaceholderText("Enter artist name"),
      name,
    );
    await userEvent.click(screen.getByRole("button", { name: "Add Artist" }));

    // Give the (denied) attempt a moment, then confirm nothing landed.
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(onSuccess).not.toHaveBeenCalled();

    const { data } = await testSupabase
      .from("artists")
      .select("id")
      .eq("name", name);
    expect(data ?? []).toHaveLength(0);
  });

  it("does not call the mutation when the name is blank", async () => {
    const userId = await signInAsTestUser();
    await grantAdminRole(userId);

    const onSuccess = vi.fn();
    renderWithQueryClient(
      <AuthProvider>
        <AddArtistDialog open onOpenChange={vi.fn()} onSuccess={onSuccess} />
      </AuthProvider>,
    );

    // react-hook-form's zod validation blocks submission before onSubmit
    // ever runs — no mutateAsync/mutate bypass hack needed here.
    await userEvent.click(
      await screen.findByRole("button", { name: "Add Artist" }),
    );

    expect(
      await screen.findByText("Artist name is required"),
    ).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

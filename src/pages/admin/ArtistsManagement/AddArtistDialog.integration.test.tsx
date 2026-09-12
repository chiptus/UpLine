import { describe, expect, it, vi, beforeEach } from "vitest";
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

// The local integration Supabase stack starts with storage-api excluded
// (see .github/workflows/integration-run.yml), so a real file upload has
// nothing to talk to here — mock only that boundary (per src/test/
// integration/README.md's narrow exception) and let artist creation run
// for real against Postgres.
const uploadArtistLogoMock = vi.fn();

vi.mock("@/services/storage", () => ({
  uploadArtistLogo: (...args: unknown[]) => uploadArtistLogoMock(...args),
}));

async function selectFile() {
  // Dialog content renders into a portal on document.body, not `container`.
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
  const file = new File(["logo"], "logo.png", { type: "image/png" });
  await userEvent.upload(input, file);
}

describe("AddArtistDialog", () => {
  beforeEach(() => {
    uploadArtistLogoMock.mockReset();
  });

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

  it("still creates the artist when the image upload fails, falling back to no image", async () => {
    const userId = await signInAsTestUser();
    await grantAdminRole(userId);
    uploadArtistLogoMock.mockRejectedValue(new Error("network down"));

    const onSuccess = vi.fn();
    const name = `Fallback Collective ${crypto.randomUUID()}`;
    renderWithQueryClient(
      <AuthProvider>
        <AddArtistDialog open onOpenChange={vi.fn()} onSuccess={onSuccess} />
      </AuthProvider>,
    );

    await userEvent.type(
      await screen.findByPlaceholderText("Enter artist name"),
      name,
    );
    await selectFile();
    await userEvent.click(screen.getByRole("button", { name: "Add Artist" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(uploadArtistLogoMock).toHaveBeenCalledOnce();

    const { data, error } = await testSupabase
      .from("artists")
      .select("name, image_url")
      .eq("name", name)
      .single();
    expect(error).toBeNull();
    expect(data?.image_url).toBeNull();

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
    // onSubmit's own `!canEdit` guard runs and returns before any mutation
    // would be called — no async gap to wait out before checking nothing
    // landed.
    await userEvent.click(screen.getByRole("button", { name: "Add Artist" }));
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

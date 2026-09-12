import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FestivalLogoDialog } from "./FestivalLogoDialog";
import {
  renderWithQueryClient,
  selectLogoFile,
  testSupabase,
} from "@/test/integration/harness";
import { signInAsTestUser } from "@/test/integration/fixtures/auth";
import { grantAdminRole } from "@/test/integration/fixtures/adminRoles";
import { createFestival } from "@/test/integration/fixtures/festivals";

// storage-api isn't in the local integration stack (see integration-run.yml) — mock only that boundary, per src/test/integration/README.md's exception.
const uploadFestivalLogoMock = vi.fn();
const deleteFestivalLogoMock = vi.fn();

vi.mock("@/services/storage", () => ({
  uploadFestivalLogo: (...args: unknown[]) => uploadFestivalLogoMock(...args),
  deleteFestivalLogo: (...args: unknown[]) => deleteFestivalLogoMock(...args),
}));

describe("FestivalLogoDialog", () => {
  beforeEach(() => {
    uploadFestivalLogoMock.mockReset();
    deleteFestivalLogoMock.mockReset();
  });

  it("uploads a new logo and updates the festival for real on success", async () => {
    const userId = await signInAsTestUser();
    await grantAdminRole(userId);
    const festival = await createFestival();
    uploadFestivalLogoMock.mockResolvedValue({
      url: "https://example.com/new-logo.png",
    });

    const onOpenChange = vi.fn();
    renderWithQueryClient(
      <FestivalLogoDialog
        open
        onOpenChange={onOpenChange}
        festival={festival}
      />,
    );

    await selectLogoFile();
    await userEvent.click(screen.getByRole("button", { name: "Upload Logo" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));

    const { data, error } = await testSupabase
      .from("festivals")
      .select("logo_url")
      .eq("id", festival.id)
      .single();
    expect(error).toBeNull();
    expect(data?.logo_url).toBe("https://example.com/new-logo.png");
  });

  it("never touches the festival when the upload itself fails", async () => {
    const userId = await signInAsTestUser();
    await grantAdminRole(userId);
    const festival = await createFestival({
      logo_url: "https://example.com/original.png",
    });
    uploadFestivalLogoMock.mockRejectedValue(new Error("network down"));

    renderWithQueryClient(
      <FestivalLogoDialog open onOpenChange={vi.fn()} festival={festival} />,
    );

    await selectLogoFile();
    const uploadButton = screen.getByRole("button", { name: "Upload Logo" });
    await userEvent.click(uploadButton);

    await waitFor(() => expect(uploadButton).not.toBeDisabled());

    const { data } = await testSupabase
      .from("festivals")
      .select("logo_url")
      .eq("id", festival.id)
      .single();
    expect(data?.logo_url).toBe("https://example.com/original.png");
  });

  it("removes the logo for real on success", async () => {
    const userId = await signInAsTestUser();
    await grantAdminRole(userId);
    const festival = await createFestival({
      logo_url: "https://example.com/original.png",
    });
    deleteFestivalLogoMock.mockResolvedValue(undefined);

    const onOpenChange = vi.fn();
    renderWithQueryClient(
      <FestivalLogoDialog
        open
        onOpenChange={onOpenChange}
        festival={festival}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Remove logo" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));

    const { data, error } = await testSupabase
      .from("festivals")
      .select("logo_url")
      .eq("id", festival.id)
      .single();
    expect(error).toBeNull();
    expect(data?.logo_url).toBeNull();
  });
});

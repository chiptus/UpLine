import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FestivalLogoDialog } from "./FestivalLogoDialog";
import type { Festival } from "@/api/festivals/types";

const mutateUpdate = vi.fn();
const toastMock = vi.fn();
const uploadFestivalLogoMock = vi.fn();
const deleteFestivalLogoMock = vi.fn();

vi.mock("@/api/festivals/useUpdateFestival", () => ({
  useUpdateFestivalMutation: () => ({
    mutate: mutateUpdate,
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/services/storage", () => ({
  uploadFestivalLogo: (...args: unknown[]) => uploadFestivalLogoMock(...args),
  deleteFestivalLogo: (...args: unknown[]) => deleteFestivalLogoMock(...args),
}));

const festival = {
  id: "festival-1",
  slug: "boom",
  name: "Boom",
  logo_url: "https://example.com/logo.png",
} as Festival;

async function selectFile() {
  // Dialog content renders into a portal on document.body, not `container`.
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
  const file = new File(["logo"], "logo.png", { type: "image/png" });
  await userEvent.upload(input, file);
}

describe("FestivalLogoDialog", () => {
  beforeEach(() => {
    mutateUpdate.mockReset();
    toastMock.mockReset();
    uploadFestivalLogoMock.mockReset();
    deleteFestivalLogoMock.mockReset();
  });

  it("uploads a new logo and updates the festival via mutate() on success", async () => {
    uploadFestivalLogoMock.mockResolvedValue({
      url: "https://example.com/new-logo.png",
    });
    const onOpenChange = vi.fn();
    render(
      <FestivalLogoDialog
        open
        onOpenChange={onOpenChange}
        festival={festival}
      />,
    );

    await selectFile();
    await userEvent.click(screen.getByRole("button", { name: "Upload Logo" }));

    expect(uploadFestivalLogoMock).toHaveBeenCalledWith(
      expect.any(File),
      "boom",
    );
    expect(mutateUpdate).toHaveBeenCalledExactlyOnceWith(
      {
        festivalId: "festival-1",
        festivalData: { logo_url: "https://example.com/new-logo.png" },
      },
      { onSuccess: expect.any(Function), onSettled: expect.any(Function) },
    );
    expect(mutateUpdate.mock.calls[0][1]).not.toHaveProperty("onError");
    expect(onOpenChange).not.toHaveBeenCalled();

    act(() => mutateUpdate.mock.calls[0][1].onSuccess());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("toasts and never calls the mutation when the upload itself fails", async () => {
    uploadFestivalLogoMock.mockRejectedValue(new Error("network down"));
    render(
      <FestivalLogoDialog open onOpenChange={vi.fn()} festival={festival} />,
    );

    await selectFile();
    await userEvent.click(screen.getByRole("button", { name: "Upload Logo" }));

    expect(mutateUpdate).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ description: "network down" }),
    );
    // isUploading must be reset so the user isn't stuck on a dead button.
    expect(
      screen.getByRole("button", { name: "Upload Logo" }),
    ).not.toBeDisabled();
  });

  it("removes the logo via mutate() without a local onError toast", async () => {
    deleteFestivalLogoMock.mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    render(
      <FestivalLogoDialog
        open
        onOpenChange={onOpenChange}
        festival={festival}
      />,
    );

    // The remove button is icon-only (no accessible name); target it by its
    // destructive styling instead. It renders into a portal on
    // document.body, not `container`.
    await userEvent.click(document.querySelector("button.bg-destructive")!);

    expect(deleteFestivalLogoMock).toHaveBeenCalledWith(festival.logo_url);
    expect(mutateUpdate).toHaveBeenCalledExactlyOnceWith(
      { festivalId: "festival-1", festivalData: { logo_url: null } },
      { onSuccess: expect.any(Function), onSettled: expect.any(Function) },
    );
    expect(mutateUpdate.mock.calls[0][1]).not.toHaveProperty("onError");

    act(() => mutateUpdate.mock.calls[0][1].onSuccess());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

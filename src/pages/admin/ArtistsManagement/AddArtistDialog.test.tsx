import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AddArtistDialog } from "./AddArtistDialog";
import { genresKeys } from "@/api/genres/types";

const mutateCreate = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" }, loading: false }),
}));

vi.mock("@/api/auth/useUserPermissions", () => ({
  useUserPermissionsQuery: () => ({ data: true, isLoading: false }),
}));

vi.mock("@/api/artists/useCreateArtist", () => ({
  useCreateArtistMutation: () => ({ mutate: mutateCreate, isPending: false }),
}));

vi.mock("@/api/artists/useUpdateArtist", () => ({
  useUpdateArtistMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("AddArtistDialog", () => {
  beforeEach(() => {
    mutateCreate.mockReset();
  });

  it("creates the artist via mutate() and resets the form on success", async () => {
    const { onSuccess } = renderDialog();

    await userEvent.type(
      screen.getByPlaceholderText("Enter artist name"),
      "Boom Collective",
    );
    await userEvent.click(screen.getByRole("button", { name: "Add Artist" }));

    expect(mutateCreate).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        name: "Boom Collective",
        added_by: "user-1",
      }),
      { onSuccess: expect.any(Function) },
    );
    expect(mutateCreate.mock.calls[0][1]).not.toHaveProperty("onError");
    expect(onSuccess).not.toHaveBeenCalled();

    mutateCreate.mock.calls[0][1].onSuccess();
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("does not call onSuccess if the mutation never succeeds", async () => {
    // useCreateArtistMutation already toasts its own error (see the hook) —
    // this only asserts the dialog doesn't optimistically close/reset.
    const { onSuccess } = renderDialog();

    await userEvent.type(
      screen.getByPlaceholderText("Enter artist name"),
      "Boom Collective",
    );
    await userEvent.click(screen.getByRole("button", { name: "Add Artist" }));

    expect(mutateCreate).toHaveBeenCalledOnce();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

function renderDialog(onSuccess = vi.fn()) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(genresKeys.all(), []);

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <AddArtistDialog open onOpenChange={vi.fn()} onSuccess={onSuccess} />
    </QueryClientProvider>,
  );
  return { ...utils, onSuccess };
}

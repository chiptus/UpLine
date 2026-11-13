import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SlugCell } from "./SlugCell";

const isArtistSlugTaken = vi.fn();
const onSave = vi.fn();

vi.mock("@/api/artists/isArtistSlugTaken", () => ({
  isArtistSlugTaken: (...args: unknown[]) => isArtistSlugTaken(...args),
}));

describe("SlugCell", () => {
  beforeEach(() => {
    isArtistSlugTaken.mockReset().mockResolvedValue(false);
    onSave.mockReset();
  });

  it("blocks an empty slug", async () => {
    await startEditing();
    await userEvent.clear(input());
    await userEvent.keyboard("{Enter}");

    expect(await screen.findByText("Slug is required")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("blocks a malformed slug", async () => {
    await startEditing();
    await userEvent.clear(input());
    await userEvent.type(input(), "Not A Slug");
    await userEvent.keyboard("{Enter}");

    expect(await screen.findByText(/Slug must contain only/)).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("lets a hyphen be typed mid-slug", async () => {
    await startEditing();
    await userEvent.clear(input());
    await userEvent.type(input(), "new-slug");
    await userEvent.keyboard("{Enter}");

    await vi.waitFor(() =>
      expect(onSave).toHaveBeenCalledWith("new-slug", expect.any(Object)),
    );
  });

  it("warns when the slug belongs to another artist", async () => {
    isArtistSlugTaken.mockResolvedValue(true);
    await startEditing();
    await userEvent.clear(input());
    await userEvent.type(input(), "taken");
    await userEvent.keyboard("{Enter}");

    expect(await screen.findByText("That slug is already in use")).toBeTruthy();
    expect(isArtistSlugTaken).toHaveBeenCalledWith({
      slug: "taken",
      excludeArtistId: "artist-1",
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows a raced conflict inline and stays open", async () => {
    onSave.mockImplementation((_slug, callbacks) =>
      callbacks.onError(new Error("That slug is already in use")),
    );
    await startEditing();
    await userEvent.clear(input());
    await userEvent.type(input(), "raced");
    await userEvent.keyboard("{Enter}");

    expect(await screen.findByText("That slug is already in use")).toBeTruthy();
    expect(screen.getByLabelText("Artist slug")).toBeTruthy();
  });

  it("does not save when the slug is unchanged", async () => {
    await startEditing();
    await userEvent.keyboard("{Enter}");

    await vi.waitFor(() =>
      expect(screen.queryByLabelText("Artist slug")).toBeNull(),
    );
    expect(onSave).not.toHaveBeenCalled();
    expect(isArtistSlugTaken).not.toHaveBeenCalled();
  });
});

async function startEditing() {
  render(<SlugCell artistId="artist-1" value="old-slug" onSave={onSave} />);
  await userEvent.click(screen.getByText("old-slug"));
}

function input() {
  return screen.getByLabelText("Artist slug");
}

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SlugCell } from "./SlugCell";

const useArtistSlugTakenQuery = vi.fn();
const onSave = vi.fn();

vi.mock("@/api/artists/useArtistSlugTaken", () => ({
  useArtistSlugTakenQuery: (...args: unknown[]) =>
    useArtistSlugTakenQuery(...args),
}));

describe("SlugCell", () => {
  beforeEach(() => {
    useArtistSlugTakenQuery.mockReset().mockReturnValue({ data: false });
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

    expect(await screen.findByText(/Use only lowercase letters/)).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows validation errors while typing, before submitting", async () => {
    await startEditing();
    await userEvent.clear(input());
    expect(await screen.findByText("Slug is required")).toBeTruthy();

    await userEvent.type(input(), "Not A Slug");
    expect(await screen.findByText(/Use only lowercase letters/)).toBeTruthy();
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

  it("warns while typing when the slug belongs to another artist", async () => {
    useArtistSlugTakenQuery.mockReturnValue({ data: true });
    await startEditing();
    await userEvent.clear(input());
    await userEvent.type(input(), "taken");

    expect(await screen.findByText("That slug is already in use")).toBeTruthy();
    expect(useArtistSlugTakenQuery).toHaveBeenLastCalledWith(
      { slug: "taken", excludeArtistId: "artist-1" },
      { enabled: true },
    );

    await userEvent.keyboard("{Enter}");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("does not look up the slug while it is invalid or unchanged", async () => {
    await startEditing();
    await userEvent.clear(input());
    await userEvent.type(input(), "Not A Slug");
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(useArtistSlugTakenQuery).not.toHaveBeenCalledWith(
      expect.anything(),
      { enabled: true },
    );
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

  it("ignores Escape and repeat submits while the save is in flight", async () => {
    onSave.mockImplementation(() => {});
    await startEditing();
    await userEvent.clear(input());
    await userEvent.type(input(), "slow");
    await userEvent.keyboard("{Enter}");
    await vi.waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

    await userEvent.keyboard("{Escape}{Enter}");

    expect(screen.getByLabelText("Artist slug")).toBeTruthy();
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("fills the slug from the artist name", async () => {
    await startEditing();
    await userEvent.click(screen.getByLabelText("Regenerate slug from name"));

    expect((input() as HTMLInputElement).value).toBe("fresh-name");
    await userEvent.type(input(), "{Enter}");
    await vi.waitFor(() =>
      expect(onSave).toHaveBeenCalledWith("fresh-name", expect.any(Object)),
    );
  });

  it("does not save when the slug is unchanged", async () => {
    await startEditing();
    await userEvent.keyboard("{Enter}");

    await vi.waitFor(() =>
      expect(screen.queryByLabelText("Artist slug")).toBeNull(),
    );
    expect(onSave).not.toHaveBeenCalled();
  });
});

async function startEditing() {
  render(
    <SlugCell
      artistId="artist-1"
      name="Fresh Name"
      value="old-slug"
      onSave={onSave}
    />,
  );
  await userEvent.click(screen.getByText("old-slug"));
}

function input() {
  return screen.getByLabelText("Artist slug");
}

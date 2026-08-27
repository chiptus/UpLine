import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ArtistSetWithCoPerformers } from "@/api/artists/useArtistsMissingLinksByEdition";
import { UntypedSetsBlock } from "./UntypedSetsBlock";

function makeSet(id: string, name: string): ArtistSetWithCoPerformers {
  return {
    id,
    name,
    description: null,
    time_start: null,
    time_end: null,
    stage_id: null,
    stage_name: null,
    set_type: null,
    co_performers: [],
  };
}

describe("UntypedSetsBlock", () => {
  it("renders a single-set heading and one picker without the set-all row", () => {
    render(
      <UntypedSetsBlock
        untypedSets={[makeSet("s1", "Morning Yoga")]}
        pendingTypes={{}}
        onPick={vi.fn()}
      />,
    );

    expect(screen.getByText("This set has no type yet")).toBeInTheDocument();
    expect(screen.queryByText("Set all to:")).not.toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Type for Morning Yoga" }),
    ).toBeInTheDocument();
  });

  it("reports a pick for one set", async () => {
    const onPick = vi.fn();
    render(
      <UntypedSetsBlock
        untypedSets={[makeSet("s1", "Morning Yoga")]}
        pendingTypes={{}}
        onPick={onPick}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Workshop" }));

    expect(onPick).toHaveBeenCalledExactlyOnceWith("s1", "workshop");
  });

  it("marks the picked type as pressed", () => {
    render(
      <UntypedSetsBlock
        untypedSets={[makeSet("s1", "Morning Yoga")]}
        pendingTypes={{ s1: "performance" }}
        onPick={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Performance" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Music" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("applies 'set all' to every untyped set", async () => {
    const onPick = vi.fn();
    render(
      <UntypedSetsBlock
        untypedSets={[makeSet("s1", "Set One"), makeSet("s2", "Set Two")]}
        pendingTypes={{}}
        onPick={onPick}
      />,
    );

    expect(screen.getByText("2 sets have no type yet")).toBeInTheDocument();

    await userEvent.click(
      within(screen.getByRole("group", { name: "Set all types" })).getByRole(
        "button",
        { name: "Music" },
      ),
    );

    expect(onPick).toHaveBeenCalledTimes(2);
    expect(onPick).toHaveBeenCalledWith("s1", "music");
    expect(onPick).toHaveBeenCalledWith("s2", "music");
  });
});

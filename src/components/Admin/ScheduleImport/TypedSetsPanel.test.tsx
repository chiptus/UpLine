import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TypedSetsPanel } from "./TypedSetsPanel";
import type { DiffResult, SetPayload } from "@/services/scheduleImport/types";

describe("TypedSetsPanel", () => {
  it("renders nothing when no set carries a type", () => {
    const diff = makeDiff({
      setsToCreate: [makePayload("Carl Cox")],
      setsToUpdate: [
        { ...makePayload("Peggy Gou"), id: "set-1", previousSetType: null },
      ],
    });
    const { container } = render(<TypedSetsPanel diff={diff} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists only sets whose CSV row carries a type", () => {
    const diff = makeDiff({
      setsToCreate: [
        { ...makePayload("Morning Yoga"), setType: "workshop" },
        makePayload("Carl Cox"),
      ],
      setsToUpdate: [
        {
          ...makePayload("Fire Show"),
          setType: "performance",
          id: "set-1",
          previousSetType: null,
        },
      ],
    });
    render(<TypedSetsPanel diff={diff} />);
    expect(screen.getByText("2 sets with a type from the CSV")).toBeVisible();
    expect(screen.getByText("Morning Yoga")).toBeVisible();
    expect(screen.getByText("Fire Show")).toBeVisible();
    expect(screen.queryByText("Carl Cox")).not.toBeInTheDocument();
  });

  it("shows stored and incoming chips when the type changes", () => {
    const diff = makeDiff({
      setsToUpdate: [
        {
          ...makePayload("Fire Show"),
          setType: "performance",
          id: "set-1",
          previousSetType: "music",
        },
      ],
    });
    render(<TypedSetsPanel diff={diff} />);
    expect(screen.getByText("Music")).toBeVisible();
    expect(screen.getByText("Performance")).toBeVisible();
  });

  it("shows a single chip when the stored type is kept", () => {
    const diff = makeDiff({
      setsToUpdate: [
        {
          ...makePayload("Fire Show"),
          setType: "performance",
          id: "set-1",
          previousSetType: "performance",
        },
      ],
    });
    render(<TypedSetsPanel diff={diff} />);
    expect(screen.getAllByText("Performance")).toHaveLength(1);
  });
});

function makePayload(name: string): SetPayload {
  return {
    name,
    setType: null,
    description: null,
    stageName: null,
    timeStart: null,
    timeEnd: null,
    artistSlugs: [],
  };
}

function makeDiff(
  operations: Partial<DiffResult["cleanOperations"]>,
): DiffResult {
  return {
    summary: {
      newArtists: 0,
      newStages: 0,
      setsMatched: 0,
      setsToCreate: 0,
      setsOrphaned: 0,
    },
    newArtistNames: [],
    cleanOperations: {
      artistsToCreate: [],
      stagesToCreate: [],
      setsToCreate: [],
      setsToUpdate: [],
      ...operations,
    },
    conflicts: { stageNameMismatches: [], orphanedSets: [] },
  };
}

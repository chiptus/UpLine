import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DiffReviewStep } from "./DiffReviewStep";
import type { DiffResult } from "@/services/scheduleImport/types";

const emptyDiff: DiffResult = {
  watermark: "0:none",
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
  },
  conflicts: { stageNameMismatches: [], orphanedSets: [] },
};

function renderStep(commitError: string | null) {
  render(
    <DiffReviewStep
      diff={emptyDiff}
      timezone="UTC"
      dbStages={[]}
      stageMismatchResolutions={{}}
      orphanResolutions={{}}
      onStageMismatchChange={vi.fn()}
      onOrphanChange={vi.fn()}
      onCommit={vi.fn()}
      onReset={vi.fn()}
      committing={false}
      commitError={commitError}
      canCommit
      currentRevealLevel="draft"
    />,
  );
}

describe("DiffReviewStep", () => {
  it("shows a dedicated message and disables the primary button when the edition changed", () => {
    renderStep(
      "edition_changed_since_analyse: The schedule changed since this review was generated.",
    );

    expect(
      screen.getByText("The schedule changed since this review"),
    ).toBeVisible();
    expect(screen.queryByText("Retry")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Commit to database" }),
    ).toBeDisabled();
  });

  it("shows the generic failure message and an enabled Retry for other commit errors", () => {
    renderStep("Stage Mainstage not found in edition edition-1");

    expect(
      screen.getByText("Import failed — no changes were saved."),
    ).toBeVisible();
    expect(
      screen.getByText("Stage Mainstage not found in edition edition-1"),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
  });
});

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SetChangesPanel } from "./SetChangesPanel";
import type { DiffResult } from "@/services/scheduleImport/types";

type SetToUpdate = DiffResult["cleanOperations"]["setsToUpdate"][number];

describe("SetChangesPanel", () => {
  it("renders nothing when no set carries a type or a change", () => {
    const { container } = render(
      <SetChangesPanel
        setsToCreate={[]}
        setsToUpdate={[makeUpdate("set-1", "Peggy Gou")]}
        timezone="UTC"
        stageMismatchResolutions={{}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("lists only sets with real changes, showing stored → incoming per field", () => {
    const changed = makeUpdate("set-1", "Fire Show");
    changed.stageName = "Main";
    changed.previous.stageName = "Side";
    changed.timeStart = "2026-07-01T21:00:00Z";
    changed.previous.timeStart = "2026-07-01T20:00:00Z";

    render(
      <SetChangesPanel
        setsToCreate={[]}
        setsToUpdate={[changed, makeUpdate("set-2", "Peggy Gou")]}
        timezone="UTC"
        stageMismatchResolutions={{}}
      />,
    );

    expect(screen.getByText("1 existing set changing")).toBeVisible();
    expect(screen.getByText("Fire Show")).toBeVisible();
    expect(screen.getByText("Side")).toBeVisible();
    expect(screen.getByText("Main")).toBeVisible();
    expect(screen.getByText("Jul 1, 8:00 PM")).toBeVisible();
    expect(screen.getByText("Jul 1, 9:00 PM")).toBeVisible();
    expect(screen.queryByText("Peggy Gou")).not.toBeInTheDocument();
    expect(screen.getByText(/1 matched set is identical/)).toBeVisible();
  });

  it("ignores a stage mismatch the admin mapped to the stored stage", () => {
    const set = makeUpdate("set-1", "Fire Show");
    set.stageName = "Main Stge";
    set.previous.stageName = "Main Stage";

    const { container } = render(
      <SetChangesPanel
        setsToCreate={[]}
        setsToUpdate={[set]}
        timezone="UTC"
        stageMismatchResolutions={{
          "Main Stge": { action: "map", dbStageName: "Main Stage" },
        }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows a first-time type as a change from no type", () => {
    const set = makeUpdate("set-1", "Fire Show");
    set.setType = "performance";

    render(
      <SetChangesPanel
        setsToCreate={[]}
        setsToUpdate={[set]}
        timezone="UTC"
        stageMismatchResolutions={{}}
      />,
    );

    expect(screen.getByText("No type")).toBeVisible();
    expect(screen.getByText("Performance")).toBeVisible();
  });

  it("keeps the blank-type explanation when only new sets carry types", () => {
    render(
      <SetChangesPanel
        setsToCreate={[{ ...makeUpdate("x", "Yoga"), setType: "workshop" }]}
        setsToUpdate={[]}
        timezone="UTC"
        stageMismatchResolutions={{}}
      />,
    );
    expect(screen.getByText("No changes to existing sets")).toBeVisible();
    expect(screen.getByText(/blank type keep whatever type/)).toBeVisible();
  });
});

function makeUpdate(id: string, name: string): SetToUpdate {
  return {
    id,
    name,
    setType: null,
    description: null,
    stageName: null,
    timeStart: null,
    timeEnd: null,
    status: "confirmed",
    artistSlugs: [],
    previous: {
      name,
      setType: null,
      description: null,
      stageName: null,
      timeStart: null,
      timeEnd: null,
      status: "confirmed",
    },
  };
}

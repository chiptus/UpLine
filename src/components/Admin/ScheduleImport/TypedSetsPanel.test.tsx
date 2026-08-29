import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TypedSetsPanel } from "./TypedSetsPanel";
import type { SetPayload } from "@/services/scheduleImport/types";

describe("TypedSetsPanel", () => {
  it("renders nothing when no set carries a type", () => {
    const { container } = render(
      <TypedSetsPanel
        setsToCreate={[makePayload("Carl Cox")]}
        setsToUpdate={[
          { ...makePayload("Peggy Gou"), id: "set-1", previousSetType: null },
        ]}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("lists only genuine type changes, with stored and incoming chips", () => {
    render(
      <TypedSetsPanel
        setsToCreate={[
          { ...makePayload("Morning Yoga"), setType: "workshop" },
          makePayload("Carl Cox"),
        ]}
        setsToUpdate={[
          {
            ...makePayload("Fire Show"),
            setType: "performance",
            id: "set-1",
            previousSetType: "music",
          },
          {
            ...makePayload("Peggy Gou"),
            setType: "music",
            id: "set-2",
            previousSetType: "music",
          },
        ]}
      />,
    );
    expect(screen.getByText("1 set changing type")).toBeVisible();
    expect(screen.getByText("Fire Show")).toBeVisible();
    expect(screen.getByText("Music")).toBeVisible();
    expect(screen.getByText("Performance")).toBeVisible();
    expect(screen.queryByText("Morning Yoga")).not.toBeInTheDocument();
    expect(screen.queryByText("Peggy Gou")).not.toBeInTheDocument();
    expect(
      screen.getByText(/2 rows carry a type that changes nothing/),
    ).toBeVisible();
  });

  it("summarizes typed rows that change nothing without listing them", () => {
    render(
      <TypedSetsPanel
        setsToCreate={[{ ...makePayload("Morning Yoga"), setType: "workshop" }]}
        setsToUpdate={[
          {
            ...makePayload("Fire Show"),
            setType: "performance",
            id: "set-1",
            previousSetType: "performance",
          },
        ]}
      />,
    );
    expect(screen.getByText("Set types from the CSV")).toBeVisible();
    expect(screen.getByText(/2 rows carry a type/)).toBeVisible();
    expect(screen.queryByText("Morning Yoga")).not.toBeInTheDocument();
    expect(screen.queryByText("Fire Show")).not.toBeInTheDocument();
  });

  it("counts a first-time type as a change, not a no-op", () => {
    render(
      <TypedSetsPanel
        setsToCreate={[]}
        setsToUpdate={[
          {
            ...makePayload("Fire Show"),
            setType: "performance",
            id: "set-1",
            previousSetType: null,
          },
          {
            ...makePayload("Sunrise Talk"),
            setType: "other",
            id: "set-2",
            previousSetType: null,
          },
        ]}
      />,
    );
    expect(screen.getByText("Set types from the CSV")).toBeVisible();
    expect(
      screen.getByText(/2 existing sets get their first type from the CSV/),
    ).toBeVisible();
    expect(screen.queryByText(/changes nothing/)).not.toBeInTheDocument();
    expect(screen.queryByText("Fire Show")).not.toBeInTheDocument();
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

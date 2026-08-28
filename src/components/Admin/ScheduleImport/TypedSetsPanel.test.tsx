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

  it("lists only sets whose CSV row carries a type", () => {
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
            previousSetType: null,
          },
        ]}
      />,
    );
    expect(screen.getByText("2 sets with a type from the CSV")).toBeVisible();
    expect(screen.getByText("Morning Yoga")).toBeVisible();
    expect(screen.getByText("Fire Show")).toBeVisible();
    expect(screen.queryByText("Carl Cox")).not.toBeInTheDocument();
  });

  it("shows stored and incoming chips when the type changes", () => {
    render(
      <TypedSetsPanel
        setsToCreate={[]}
        setsToUpdate={[
          {
            ...makePayload("Fire Show"),
            setType: "performance",
            id: "set-1",
            previousSetType: "music",
          },
        ]}
      />,
    );
    expect(screen.getByText("Music")).toBeVisible();
    expect(screen.getByText("Performance")).toBeVisible();
  });

  it("shows a single chip when the stored type is kept", () => {
    render(
      <TypedSetsPanel
        setsToCreate={[]}
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

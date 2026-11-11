import { describe, expect, it } from "vitest";
import { getFieldChanges } from "./setFieldChanges";
import type { DiffResult } from "./types";

type SetToUpdate = DiffResult["cleanOperations"]["setsToUpdate"][number];

describe("getFieldChanges", () => {
  it("returns nothing when every field matches", () => {
    expect(getFieldChanges(makeSet())).toEqual([]);
  });

  it("reports only the fields that differ", () => {
    const set = makeSet({ name: "Fire Show 2", stageName: "Main" });
    set.previous.stageName = "Side";
    expect(getFieldChanges(set)).toEqual([
      { field: "name", stored: "Fire Show", incoming: "Fire Show 2" },
      { field: "stage", stored: "Side", incoming: "Main" },
    ]);
  });

  it("treats different spellings of the same instant as unchanged", () => {
    const set = makeSet({ timeStart: "2026-07-01T20:00:00Z" });
    set.previous.timeStart = "2026-07-01T20:00:00+00:00";
    expect(getFieldChanges(set)).toEqual([]);
  });

  it("reports a time change and a cleared end time", () => {
    const set = makeSet({ timeStart: "2026-07-01T21:00:00Z", timeEnd: null });
    set.previous.timeStart = "2026-07-01T20:00:00Z";
    set.previous.timeEnd = "2026-07-01T22:00:00Z";
    expect(getFieldChanges(set).map((c) => c.field)).toEqual([
      "timeStart",
      "timeEnd",
    ]);
  });

  it("ignores a blank CSV type but reports a first-time assignment", () => {
    const blank = makeSet({ setType: null });
    blank.previous.setType = "music";
    expect(getFieldChanges(blank)).toEqual([]);

    const first = makeSet({ setType: "performance" });
    expect(getFieldChanges(first)).toEqual([
      { field: "type", stored: null, incoming: "performance" },
    ]);
  });

  it("treats null and empty description as equal", () => {
    const set = makeSet({ description: null });
    set.previous.description = "";
    expect(getFieldChanges(set)).toEqual([]);
  });
});

function makeSet(overrides: Partial<SetToUpdate> = {}): SetToUpdate {
  return {
    id: "set-1",
    name: "Fire Show",
    setType: null,
    description: null,
    stageName: null,
    timeStart: null,
    timeEnd: null,
    status: "confirmed",
    artistSlugs: [],
    previous: {
      name: "Fire Show",
      setType: null,
      description: null,
      stageName: null,
      timeStart: null,
      timeEnd: null,
    },
    ...overrides,
  };
}

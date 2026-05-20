import { describe, it, expect } from "vitest";
import { parseScheduleCsv } from "./parseCsv";

describe("parseScheduleCsv", () => {
  it("parses a full row with every column", () => {
    const csv = [
      "Artists,Set Name,Stage,Date,Start Time,End Time,Description",
      "Carl Cox,Carl Cox Live,Main Stage,2026-07-11,22:00,00:00,House set",
    ].join("\n");

    expect(parseScheduleCsv(csv)).toEqual([
      {
        artists: ["Carl Cox"],
        setName: "Carl Cox Live",
        stage: "Main Stage",
        date: "2026-07-11",
        startTime: "22:00",
        endTime: "00:00",
        description: "House set",
      },
    ]);
  });

  it("splits pipe-separated artists for B2B sets", () => {
    const csv = ["Artists,Stage", "Carl Cox | Peggy Gou,Main"].join("\n");
    expect(parseScheduleCsv(csv)[0].artists).toEqual(["Carl Cox", "Peggy Gou"]);
  });

  it("omits optional columns when not present in the header", () => {
    const csv = ["Artists,Date", "DJ Tennis,2026-07-12"].join("\n");
    expect(parseScheduleCsv(csv)).toEqual([
      {
        artists: ["DJ Tennis"],
        setName: undefined,
        stage: undefined,
        date: "2026-07-12",
        startTime: undefined,
        endTime: undefined,
        description: undefined,
      },
    ]);
  });

  it("skips rows with no artists", () => {
    const csv = ["Artists,Stage", "Carl Cox,Main", ",Side", "Peggy Gou,"].join(
      "\n",
    );
    const rows = parseScheduleCsv(csv);
    expect(rows.map((r) => r.artists)).toEqual([["Carl Cox"], ["Peggy Gou"]]);
  });

  it("is case-insensitive about header names", () => {
    const csv = ["ARTISTS,STAGE", "Carl Cox,Main"].join("\n");
    expect(parseScheduleCsv(csv)[0].stage).toBe("Main");
  });

  it("throws when the CSV has unmatched quotes", () => {
    const csv = ["Artists,Stage", '"Carl Cox,Main'].join("\n");
    expect(() => parseScheduleCsv(csv)).toThrow(/Could not parse CSV/);
  });
});

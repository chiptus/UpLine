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
        setType: null,
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
        setType: null,
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

  it("de-duplicates repeated artists within a row (case-insensitive)", () => {
    const csv = ["Artists,Stage", "Carl Cox | carl cox | Peggy Gou,Main"].join(
      "\n",
    );
    expect(parseScheduleCsv(csv)[0].artists).toEqual(["Carl Cox", "Peggy Gou"]);
  });

  it("parses a valid type value", () => {
    const csv = ["Artists,Type", "Carl Cox,workshop"].join("\n");
    expect(parseScheduleCsv(csv)[0].setType).toBe("workshop");
  });

  it("normalizes type casing and whitespace", () => {
    const csv = ["Artists,Type", "Carl Cox,  Workshop "].join("\n");
    expect(parseScheduleCsv(csv)[0].setType).toBe("workshop");
  });

  it("parses a blank type as null", () => {
    const csv = ["Artists,Type", "Carl Cox,"].join("\n");
    expect(parseScheduleCsv(csv)[0].setType).toBeNull();
  });

  it("parses a missing type column as null", () => {
    const csv = ["Artists,Stage", "Carl Cox,Main"].join("\n");
    expect(parseScheduleCsv(csv)[0].setType).toBeNull();
  });

  it("ignores an invalid type on a row that is skipped anyway", () => {
    const csv = ["Artists,Set Name,Type", "Carl Cox,,music", ",,concert"].join(
      "\n",
    );
    expect(parseScheduleCsv(csv)).toHaveLength(1);
  });

  it("throws on an invalid type value", () => {
    const csv = ["Artists,Type", "Carl Cox,concert"].join("\n");
    expect(() => parseScheduleCsv(csv)).toThrow(/Invalid type "concert"/);
  });

  it("keeps artist-less rows that have a set name", () => {
    const csv = [
      "Artists,Set Name,Type",
      ",Morning Yoga,workshop",
      "Carl Cox,,",
    ].join("\n");
    const rows = parseScheduleCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].artists).toEqual([]);
    expect(rows[0].setName).toBe("Morning Yoga");
    expect(rows[0].setType).toBe("workshop");
  });

  it("still skips rows with neither artists nor a set name", () => {
    const csv = ["Artists,Set Name,Stage", "Carl Cox,,Main", ",,Side"].join(
      "\n",
    );
    expect(parseScheduleCsv(csv)).toHaveLength(1);
  });

  it("throws when an artist-less row's set name has no letters or digits", () => {
    const csv = ["Artists,Set Name", ",???"].join("\n");
    expect(() => parseScheduleCsv(csv)).toThrow(/no letters or digits/);
  });

  it("throws when an artist name has no letters or digits", () => {
    const csv = ["Artists,Stage", "!!!,Main"].join("\n");
    expect(() => parseScheduleCsv(csv)).toThrow(/no letters or digits/);
  });

  it("throws when a stage name has no letters or digits", () => {
    const csv = ["Artists,Stage", "Carl Cox,---"].join("\n");
    expect(() => parseScheduleCsv(csv)).toThrow(/no letters or digits/);
  });
});

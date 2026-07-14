import { describe, expect, it } from "vitest";
import { timelineSearchSchema } from "./searchSchemas";

describe("timelineSearchSchema", () => {
  describe("votes (my-vote chips)", () => {
    it("keeps valid vote types", () => {
      const parsed = timelineSearchSchema.parse({
        votes: ["mustGo", "interested", "wontGo"],
      });

      expect(parsed.votes).toEqual(["mustGo", "interested", "wontGo"]);
    });

    it("drops only the invalid entries, keeping valid ones", () => {
      const parsed = timelineSearchSchema.parse({
        votes: ["mustGo", "bogus"],
      });

      expect(parsed.votes).toEqual(["mustGo"]);
    });

    it("falls back to an empty selection when votes is not an array", () => {
      const parsed = timelineSearchSchema.parse({ votes: "junk" });

      expect(parsed.votes).toEqual([]);
    });

    it("defaults to an empty selection when votes is absent", () => {
      const parsed = timelineSearchSchema.parse({});

      expect(parsed.votes).toEqual([]);
    });
  });
});

import { describe, expect, it } from "vitest";
import { tallyVotes } from "./score";

function vote(vote_type: number) {
  return { vote_type };
}

describe("tallyVotes", () => {
  it("returns zero counts and zero score for no votes", () => {
    expect(tallyVotes([])).toEqual({
      counts: { mustGo: 0, interested: 0, wontGo: 0 },
      score: 0,
    });
  });

  it("returns zero counts and zero score for undefined votes", () => {
    expect(tallyVotes(undefined)).toEqual({
      counts: { mustGo: 0, interested: 0, wontGo: 0 },
      score: 0,
    });
  });

  it("returns zero counts and zero score for null votes", () => {
    expect(tallyVotes(null)).toEqual({
      counts: { mustGo: 0, interested: 0, wontGo: 0 },
      score: 0,
    });
  });

  it("counts each vote type", () => {
    const { counts } = tallyVotes([
      vote(2),
      vote(2),
      vote(2),
      vote(1),
      vote(1),
      vote(-1),
    ]);
    expect(counts).toEqual({ mustGo: 3, interested: 2, wontGo: 1 });
  });

  it("scores as the sum of vote values: 2·mustGo + interested − wontGo", () => {
    const { score } = tallyVotes([
      vote(2),
      vote(2),
      vote(2),
      vote(1),
      vote(1),
      vote(-1),
    ]);
    expect(score).toBe(2 * 3 + 2 - 1);
  });

  it("goes negative when Won't Go votes outweigh the rest", () => {
    const { score } = tallyVotes([vote(-1), vote(-1), vote(-1), vote(1)]);
    expect(score).toBe(-2);
  });

  it("scores an all-negative vote set as minus the vote count", () => {
    expect(tallyVotes([vote(-1), vote(-1), vote(-1)])).toEqual({
      counts: { mustGo: 0, interested: 0, wontGo: 3 },
      score: -3,
    });
  });

  it("ignores unknown vote_type values in both counts and score", () => {
    const result = tallyVotes([vote(2), vote(0), vote(99), vote(-5)]);
    expect(result).toEqual({
      counts: { mustGo: 1, interested: 0, wontGo: 0 },
      score: 2,
    });
  });

  it("tallies a group-scoped subset independently of the full set", () => {
    const all = [vote(2), vote(2), vote(1), vote(-1)];
    const groupSubset = all.slice(0, 2);
    expect(tallyVotes(all).score).toBe(4);
    expect(tallyVotes(groupSubset).score).toBe(4);
    expect(tallyVotes(groupSubset).counts).toEqual({
      mustGo: 2,
      interested: 0,
      wontGo: 0,
    });
  });
});

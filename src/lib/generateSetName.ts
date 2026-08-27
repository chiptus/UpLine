import type { SetType } from "@/api/sets/types";

/**
 * Auto-generates a set name from its artists. Only music sets get a
 * generated name — workshops, performances, other, and untyped sets
 * are named by hand.
 */
export function generateSetName(
  artistNames: string[],
  setType: SetType | null,
): string {
  if (setType !== "music") return "";
  if (artistNames.length === 0) return "";
  if (artistNames.length === 1) return artistNames[0];
  if (artistNames.length === 2) return `${artistNames[0]} vs ${artistNames[1]}`;
  return `${artistNames[0]} + ${artistNames.length - 1} more`;
}

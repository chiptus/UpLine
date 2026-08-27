import type { SetType } from "@/api/sets/types";

export function matchesSetTypeFilter(
  setType: SetType | null,
  selectedTypes: string[],
): boolean {
  if (selectedTypes.length === 0) return true;
  return selectedTypes.includes(setType ?? "other");
}

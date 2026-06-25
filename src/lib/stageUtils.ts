import type { Stage } from "@/api/stages/types";

/**
 * Sorts stages by priority: stages with order > 0 come first (sorted by order),
 * then stages with order 0 come last (sorted alphabetically by name)
 */
export function sortStagesByOrder<
  T extends Pick<Stage, "stage_order" | "name">,
>(items: T[]): T[] {
  return items.sort((stageA, stageB) => {
    const orderA = stageA.stage_order ?? 0;
    const orderB = stageB.stage_order ?? 0;

    // Stages with order > 0 come first, sorted by order
    // Stages with order 0 come last, sorted by name
    if (orderA > 0 && orderB > 0) {
      return orderA - orderB;
    }
    if (orderA > 0 && orderB === 0) {
      return -1; // A comes before B
    }
    if (orderA === 0 && orderB > 0) {
      return 1; // B comes before A
    }
    // Both are 0, sort by name
    return stageA.name.localeCompare(stageB.name);
  });
}

import { describe, expect, it } from "vitest";
import { sortStagesByOrder } from "./stageUtils";

describe("sortStagesByOrder", () => {
  it("sorts stages with order > 0 by their order value", () => {
    const stages = [
      { name: "Stage C", stage_order: 3 },
      { name: "Stage A", stage_order: 1 },
      { name: "Stage B", stage_order: 2 },
    ];

    const sorted = sortStagesByOrder(stages);

    expect(sorted[0].name).toBe("Stage A");
    expect(sorted[1].name).toBe("Stage B");
    expect(sorted[2].name).toBe("Stage C");
  });

  it("places stages with order 0 at the end, sorted alphabetically", () => {
    const stages = [
      { name: "Stage B", stage_order: 0 },
      { name: "Stage A", stage_order: 0 },
      { name: "Stage C", stage_order: 0 },
    ];

    const sorted = sortStagesByOrder(stages);

    expect(sorted[0].name).toBe("Stage A");
    expect(sorted[1].name).toBe("Stage B");
    expect(sorted[2].name).toBe("Stage C");
  });

  it("places ordered stages before unordered stages", () => {
    const stages = [
      { name: "Zebra Stage", stage_order: 0 },
      { name: "Main Stage", stage_order: 1 },
      { name: "Second Stage", stage_order: 2 },
      { name: "Alpha Stage", stage_order: 0 },
    ];

    const sorted = sortStagesByOrder(stages);

    expect(sorted[0].name).toBe("Main Stage");
    expect(sorted[1].name).toBe("Second Stage");
    expect(sorted[2].name).toBe("Alpha Stage");
    expect(sorted[3].name).toBe("Zebra Stage");
  });

  it("handles null stage_order as 0", () => {
    const stages: Array<{ name: string; stage_order: number | null }> = [
      { name: "Stage B", stage_order: null },
      { name: "Stage A", stage_order: 1 },
      { name: "Stage C", stage_order: null },
    ];

    const sorted = sortStagesByOrder(
      stages as Array<{ name: string; stage_order: number }>,
    );

    expect(sorted[0].name).toBe("Stage A");
    expect(sorted[1].name).toBe("Stage B");
    expect(sorted[2].name).toBe("Stage C");
  });

  it("handles undefined stage_order as 0", () => {
    const stages: Array<{ name: string; stage_order: number | undefined }> = [
      { name: "Stage B", stage_order: undefined },
      { name: "Stage A", stage_order: 1 },
      { name: "Stage C", stage_order: undefined },
    ];

    const sorted = sortStagesByOrder(
      stages as Array<{ name: string; stage_order: number }>,
    );

    expect(sorted[0].name).toBe("Stage A");
    expect(sorted[1].name).toBe("Stage B");
    expect(sorted[2].name).toBe("Stage C");
  });

  it("handles mixed ordered and unordered stages", () => {
    const stages = [
      { name: "Unordered Z", stage_order: 0 },
      { name: "Ordered 3", stage_order: 3 },
      { name: "Unordered A", stage_order: 0 },
      { name: "Ordered 1", stage_order: 1 },
      { name: "Ordered 2", stage_order: 2 },
      { name: "Unordered M", stage_order: 0 },
    ];

    const sorted = sortStagesByOrder(stages);

    expect(sorted[0].name).toBe("Ordered 1");
    expect(sorted[1].name).toBe("Ordered 2");
    expect(sorted[2].name).toBe("Ordered 3");
    expect(sorted[3].name).toBe("Unordered A");
    expect(sorted[4].name).toBe("Unordered M");
    expect(sorted[5].name).toBe("Unordered Z");
  });

  it("handles empty array", () => {
    const stages: Array<{ name: string; stage_order: number | null }> = [];
    const sorted = sortStagesByOrder(
      stages as Array<{ name: string; stage_order: number }>,
    );
    expect(sorted).toEqual([]);
  });

  it("handles single stage", () => {
    const stages = [{ name: "Only Stage", stage_order: 1 }];
    const sorted = sortStagesByOrder(stages);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].name).toBe("Only Stage");
  });

  it("preserves other properties of stages", () => {
    const stages = [
      { name: "Stage B", stage_order: 2, color: "#ff0000", id: "b" },
      { name: "Stage A", stage_order: 1, color: "#00ff00", id: "a" },
    ];

    const sorted = sortStagesByOrder(stages);

    expect(sorted[0]).toEqual({
      name: "Stage A",
      stage_order: 1,
      color: "#00ff00",
      id: "a",
    });
    expect(sorted[1]).toEqual({
      name: "Stage B",
      stage_order: 2,
      color: "#ff0000",
      id: "b",
    });
  });

  it("is stable for stages with same order", () => {
    const stages = [
      { name: "Stage C", stage_order: 1 },
      { name: "Stage A", stage_order: 1 },
      { name: "Stage B", stage_order: 1 },
    ];

    const sorted = sortStagesByOrder(stages);

    expect(sorted).toHaveLength(3);
    expect(sorted.every((s) => s.stage_order === 1)).toBe(true);
  });

  it("handles case-sensitive alphabetical sorting", () => {
    const stages = [
      { name: "zebra", stage_order: 0 },
      { name: "Apple", stage_order: 0 },
      { name: "banana", stage_order: 0 },
    ];

    const sorted = sortStagesByOrder(stages);

    expect(sorted[0].name).toBe("Apple");
    expect(sorted[1].name).toBe("banana");
    expect(sorted[2].name).toBe("zebra");
  });
});

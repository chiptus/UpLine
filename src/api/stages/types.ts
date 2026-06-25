export type { Stage } from "@/api/sets/types";

export const stagesKeys = {
  all: ["stages"] as const,
  byEdition: (editionId: string) => ["stages", { editionId }] as const,
  byId: (stageId: string) => ["stages", { stageId }] as const,
};

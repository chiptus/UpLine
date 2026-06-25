import type { Database } from "@/integrations/supabase/types";

export type Stage = Database["public"]["Tables"]["stages"]["Row"];

export const stagesKeys = {
  all: ["stages"] as const,
  byEdition: (editionId: string) => ["stages", { editionId }] as const,
  byId: (stageId: string) => ["stages", { stageId }] as const,
};

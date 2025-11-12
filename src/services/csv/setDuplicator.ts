import { supabase } from "@/integrations/supabase/client";

export async function duplicateSetWithVotes({
  newTimeEnd,
  newTimeStart,
  sourceSetId,
  description,
  stageId,
}: {
  sourceSetId: string;
  newTimeStart: string;
  newTimeEnd: string;
  stageId?: string | null;
  description?: string | null;
}): Promise<string> {
  const params: {
    source_set_id: string;
    new_time_start: string;
    new_time_end: string;
    new_stage_id?: string | null;
    new_description?: string | null;
  } = {
    source_set_id: sourceSetId,
    new_time_start: newTimeStart,
    new_time_end: newTimeEnd,
  };

  if (stageId !== undefined) {
    params.new_stage_id = stageId;
  }

  if (description !== undefined) {
    params.new_description = description;
  }

  const { data, error } = await supabase.rpc(
    "duplicate_set_with_votes",
    params,
  );

  if (error) {
    throw new Error(`Failed to duplicate set: ${error.message}`);
  }

  if (!data) {
    throw new Error("No set ID returned from duplication");
  }

  return data as string;
}

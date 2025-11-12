import { supabase } from "@/integrations/supabase/client";

export async function duplicateSetWithVotes(
  sourceSetId: string,
  newTimeStart: string,
  newTimeEnd: string,
  stageId?: string | null,
  description?: string | null,
): Promise<string> {
  const { data, error } = await supabase.rpc("duplicate_set_with_votes", {
    source_set_id: sourceSetId,
    new_time_start: newTimeStart,
    new_time_end: newTimeEnd,
  });

  if (error) {
    throw new Error(`Failed to duplicate set: ${error.message}`);
  }

  if (!data) {
    throw new Error("No set ID returned from duplication");
  }

  const newSetId = data as string;

  if (stageId !== undefined || description !== undefined) {
    const updateData: {
      stage_id?: string | null;
      description?: string | null;
    } = {};
    if (stageId !== undefined) updateData.stage_id = stageId;
    if (description !== undefined) updateData.description = description;

    const { error: updateError } = await supabase
      .from("sets")
      .update(updateData)
      .eq("id", newSetId);

    if (updateError) {
      throw new Error(
        `Failed to update duplicated set: ${updateError.message}`,
      );
    }
  }

  return newSetId;
}

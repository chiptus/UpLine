import { supabase } from "@/integrations/supabase/client";

export async function duplicateSetWithVotes(
  sourceSetId: string,
  newTimeStart: string,
  newTimeEnd: string,
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

  return data as string;
}

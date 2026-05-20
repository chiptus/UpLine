import { supabase } from "@/integrations/supabase/client";
import { buildCommitPayload } from "./buildCommitPayload";
import {
  commitResultSchema,
  diffResultSchema,
  type CommitResult,
  type CsvRow,
  type DiffResult,
} from "./types";

export async function callDiffSchedule(
  festivalEditionId: string,
  timezone: string,
  rows: CsvRow[],
): Promise<DiffResult> {
  const { data, error } = await supabase.functions.invoke("diff-schedule", {
    body: { festivalEditionId, timezone, rows },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return diffResultSchema.parse(data);
}

export async function callCommitSchedule(
  festivalEditionId: string,
  payload: ReturnType<typeof buildCommitPayload>,
): Promise<CommitResult> {
  const { data, error } = await supabase.functions.invoke("commit-schedule", {
    body: { festivalEditionId, ...payload },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return commitResultSchema.parse(data);
}

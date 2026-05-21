import { FunctionsHttpError } from "@supabase/supabase-js";
import { z } from "zod";
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
  return invokeEdgeFunction(
    "diff-schedule",
    { festivalEditionId, timezone, rows },
    diffResultSchema,
  );
}

export async function callCommitSchedule(
  festivalEditionId: string,
  payload: ReturnType<typeof buildCommitPayload>,
): Promise<CommitResult> {
  return invokeEdgeFunction(
    "commit-schedule",
    { festivalEditionId, ...payload },
    commitResultSchema,
  );
}

async function invokeEdgeFunction<T>(
  name: string,
  body: Record<string, unknown>,
  schema: z.ZodType<T>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw await edgeFunctionError(error);
  if (data?.error) throw new Error(data.error);
  return schema.parse(data);
}

// On a non-2xx response supabase-js only exposes a generic message, so read
// the function's JSON error body (validation issues / RPC exception) to give
// the UI something actionable.
async function edgeFunctionError(error: unknown): Promise<Error> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body?.error) {
        return new Error(
          body.issues
            ? `${body.error}: ${JSON.stringify(body.issues)}`
            : body.error,
        );
      }
    } catch {
      // no JSON body — fall through to the generic message
    }
  }
  return error instanceof Error ? error : new Error(String(error));
}

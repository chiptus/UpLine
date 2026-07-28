import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Festival, festivalsKeys } from "./types";
import { isTimeoutError, withTimeout } from "@/lib/timeout";

async function fetchFestivals({
  all,
  signal,
}: { all?: boolean; signal?: AbortSignal } = {}): Promise<Festival[]> {
  let query = supabase
    .from("festivals")
    .select("*")
    .eq("archived", false)
    .order("name");

  if (!all) {
    query = query.eq("published", true);
  }

  const { data, error } = await query.abortSignal(signal!);

  if (error) {
    if (isTimeoutError(signal)) {
      throw new Error("Failed to load festivals - request timed out");
    }
    throw new Error("Failed to load festivals");
  }

  return data || [];
}

export function festivalsQuery({
  all,
  timeoutMs = 10000,
}: { all?: boolean; timeoutMs?: number } = {}) {
  return queryOptions({
    queryKey: festivalsKeys.all({ all }),
    queryFn: ({ signal }) =>
      fetchFestivals({ all, signal: withTimeout(signal, timeoutMs) }),
  });
}

export function useFestivalsQuery({ all }: { all?: boolean } = {}) {
  return useSuspenseQuery(festivalsQuery({ all }));
}

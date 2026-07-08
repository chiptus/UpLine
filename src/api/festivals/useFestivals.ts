import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Festival, festivalsKeys } from "./types";
import { timeoutSignal } from "@/lib/timeout";

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

  try {
    const { data, error } = await query.abortSignal(timeoutSignal(signal));

    if (error) {
      throw new Error("Failed to load festivals");
    }

    return data || [];
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new Error("Failed to load festivals - request timed out");
    }
    throw err;
  }
}

export function festivalsQuery({ all }: { all?: boolean } = {}) {
  return queryOptions({
    queryKey: festivalsKeys.all(),
    queryFn: ({ signal }) => fetchFestivals({ all, signal }),
  });
}

export function useFestivalsQuery({ all }: { all?: boolean } = {}) {
  return useQuery(festivalsQuery({ all }));
}

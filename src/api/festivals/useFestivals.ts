import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Festival, festivalsKeys } from "./types";
import { withTimeout } from "@/lib/timeout";

async function fetchFestivals({ all }: { all?: boolean } = {}): Promise<
  Festival[]
> {
  let query = supabase
    .from("festivals")
    .select("*")
    .eq("archived", false)
    .order("name");

  if (!all) {
    query = query.eq("published", true);
  }

  try {
    const { data, error } = await withTimeout(query, 10000);

    if (error) {
      throw new Error("Failed to load festivals");
    }

    return data || [];
  } catch (err) {
    if (err instanceof Error && err.message === "Request timeout") {
      throw new Error("Failed to load festivals - request timed out");
    }
    throw err;
  }
}

export function festivalsQuery({ all }: { all?: boolean } = {}) {
  return queryOptions({
    queryKey: festivalsKeys.all(),
    queryFn: () => fetchFestivals({ all }),
  });
}

export function useFestivalsQuery({ all }: { all?: boolean } = {}) {
  return useQuery(festivalsQuery({ all }));
}

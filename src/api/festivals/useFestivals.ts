import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Festival, festivalsKeys } from "./types";

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

  const { data, error } = await query;

  if (error) {
    throw new Error("Failed to load festivals");
  }

  return data || [];
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

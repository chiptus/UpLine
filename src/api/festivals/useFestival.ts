import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Festival, festivalsKeys } from "./types";

async function fetchFestival(festivalId: string): Promise<Festival> {
  const { data, error } = await supabase
    .from("festivals")
    .select("*")
    .eq("archived", false)
    .eq("id", festivalId)
    .order("name")
    .single();

  if (error) {
    throw new Error("Failed to load festival");
  }

  return data;
}

export function festivalQuery(festivalId: string) {
  return queryOptions({
    queryKey: festivalsKeys.item(festivalId),
    queryFn: () => fetchFestival(festivalId),
  });
}

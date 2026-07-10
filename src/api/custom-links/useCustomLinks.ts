import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CustomLink, customLinksKeys } from "./types";

async function fetchCustomLinks(festivalId: string): Promise<CustomLink[]> {
  const { data, error } = await supabase
    .from("custom_links")
    .select("*")
    .eq("festival_id", festivalId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching custom links:", error);
    throw new Error("Failed to fetch custom links");
  }

  return data || [];
}

export function customLinksQuery(festivalId: string) {
  return queryOptions({
    queryKey: customLinksKeys.byFestival(festivalId),
    queryFn: () => fetchCustomLinks(festivalId),
  });
}

export function useCustomLinksQuery(festivalId: string | undefined) {
  return useQuery({
    ...customLinksQuery(festivalId!),
    enabled: !!festivalId,
  });
}

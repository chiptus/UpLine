import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { customLinksKeys } from "./types";

interface BulkUpdateCustomLinksData {
  festivalId: string;
  links: Array<{
    id?: string;
    title: string;
    url: string;
    display_order: number;
  }>;
}

async function bulkUpdateCustomLinks({
  festivalId,
  links,
}: BulkUpdateCustomLinksData) {
  // First, get existing links
  const { data: existingLinks, error: fetchError } = await supabase
    .from("custom_links")
    .select("id")
    .eq("festival_id", festivalId);

  if (fetchError) throw fetchError;

  // Delete existing links that aren't in the new list
  const newLinkIds = links.filter((link) => link.id).map((link) => link.id);
  const linksToDelete =
    existingLinks?.filter((link) => !newLinkIds.includes(link.id)) || [];

  if (linksToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("custom_links")
      .delete()
      .in(
        "id",
        linksToDelete.map((link) => link.id),
      );

    if (deleteError) throw deleteError;
  }

  // Update or create links
  const promises = links.map(async (link, index) => {
    const linkData = {
      title: link.title,
      url: link.url,
      display_order: index,
    };

    if (link.id) {
      // Update existing link
      const { error } = await supabase
        .from("custom_links")
        .update(linkData)
        .eq("id", link.id);

      if (error) throw error;
    } else {
      // Create new link
      const { error } = await supabase.from("custom_links").insert({
        ...linkData,
        festival_id: festivalId,
      });

      if (error) throw error;
    }
  });

  await Promise.all(promises);
}

export function useBulkUpdateCustomLinksMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: bulkUpdateCustomLinks,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: customLinksKeys.byFestival(variables.festivalId),
      });
      toast({
        title: "Success",
        description: "Custom links updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating custom links:", error);
      toast({
        title: "Error",
        description: "Failed to update custom links",
        variant: "destructive",
      });
    },
  });
}

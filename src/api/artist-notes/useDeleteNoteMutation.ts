import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { artistsKeys } from "@/api/artists/types";

async function deleteArtistNote(noteId: string) {
  const { error } = await supabase
    .from("artist_notes")
    .delete()
    .eq("id", noteId);

  if (error) throw new Error("Failed to delete note");
  return true;
}

export function useDeleteNoteMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteArtistNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistsKeys.all });
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    },
  });
}

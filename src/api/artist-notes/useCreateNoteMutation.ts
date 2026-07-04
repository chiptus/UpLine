import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { artistNotesKeys } from "./types";

async function createNote({
  setId,
  userId,
  noteContent,
}: {
  setId: string;
  userId: string;
  noteContent: string;
}) {
  const { data, error } = await supabase
    .from("artist_notes")
    .upsert({
      artist_id: setId,
      user_id: userId,
      note_content: noteContent,
    })
    .select()
    .single();

  if (error) throw new Error("Failed to save note");
  return data;
}

export function useCreateNoteMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createNote,
    onSuccess: (_, variables) => {
      // Invalidate and refetch notes for this artist
      queryClient.invalidateQueries({
        queryKey: artistNotesKeys.notes(variables.setId),
      });
      toast({
        title: "Success",
        description: "Note saved successfully",
      });
    },
    onError: (error) => {
      console.error("Error saving note:", error);
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    },
  });
}

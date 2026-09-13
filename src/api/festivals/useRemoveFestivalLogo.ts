import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { deleteFestivalLogo } from "@/services/storage";
import { updateFestival } from "./useUpdateFestival";
import { festivalsKeys } from "./types";

async function removeFestivalLogo(input: {
  festivalId: string;
  logoUrl: string;
}) {
  await deleteFestivalLogo(input.logoUrl);
  return updateFestival(input.festivalId, { logo_url: null });
}

export function useRemoveFestivalLogoMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: removeFestivalLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: festivalsKeys.root() });
      toast({
        title: "Success",
        description: "Festival logo removed successfully",
      });
    },
    onError: (error) => {
      console.error("Error removing festival logo:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to remove logo",
        variant: "destructive",
      });
    },
  });
}

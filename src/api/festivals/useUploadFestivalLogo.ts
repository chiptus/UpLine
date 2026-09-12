import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { uploadFestivalLogo } from "@/services/storage";
import { updateFestival } from "./useUpdateFestival";
import { festivalsKeys } from "./types";

async function uploadAndSetFestivalLogo(input: {
  festivalId: string;
  festivalSlug: string;
  logoFile: File;
}) {
  const { url } = await uploadFestivalLogo(input.logoFile, input.festivalSlug);
  return updateFestival(input.festivalId, { logo_url: url });
}

export function useUploadFestivalLogoMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: uploadAndSetFestivalLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: festivalsKeys.root() });
      toast({
        title: "Success",
        description: "Festival logo updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error uploading festival logo:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload logo",
        variant: "destructive",
      });
    },
  });
}

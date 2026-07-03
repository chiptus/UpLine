import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { uploadArtistLogo } from "@/services/storage";
import { artistsKeys } from "@/api/artists/types";

interface UploadArtistImageVariables {
  file: File;
  artistId: string;
}

// Business logic function
async function uploadArtistImage({
  file,
  artistId,
}: UploadArtistImageVariables): Promise<string> {
  const result = await uploadArtistLogo(file, artistId);
  return result.url;
}

// Hook
export function useUploadArtistImageMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: uploadArtistImage,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: artistsKeys.all,
      });

      toast({
        title: "Success",
        description: "Artist image uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to upload image",
        variant: "destructive",
      });
    },
  });
}

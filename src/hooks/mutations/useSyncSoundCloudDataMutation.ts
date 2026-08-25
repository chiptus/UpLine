import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type SyncResponse = {
  message: string;
  artistsToProcess: number;
  startedAt: string;
};

async function syncSoundCloudData(): Promise<SyncResponse> {
  const { data, error } = await supabase.functions.invoke("sync-artist-data", {
    body: {},
  });

  if (error) {
    throw new Error(error.message || "Failed to start SoundCloud sync");
  }

  return data;
}

export function useSyncSoundCloudDataMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: syncSoundCloudData,
    onSuccess: (data) => {
      toast({
        title: `SoundCloud sync started! Processing ${data.artistsToProcess} artists.`,
        description:
          "The sync is running in the background. Check back in a few minutes.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to start SoundCloud sync",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Music } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPermissionsQuery } from "@/api/auth/useUserPermissions";
import { useGenresQuery } from "@/api/genres/useGenres";
import { useCreateArtistMutation } from "@/api/artists/useCreateArtist";
import { useUpdateArtistMutation } from "@/api/artists/useUpdateArtist";
import { GenreMultiSelect } from "./GenreMultiSelect";
import { FileUpload } from "@/components/ui/file-upload";
import { uploadArtistLogo } from "@/services/storage";
import { useState } from "react";

// Form validation schema
const artistFormSchema = z.object({
  name: z.string().min(1, "Artist name is required"),
  description: z.string().optional(),
  genre_ids: z.array(z.string()).optional(),
  spotifyUrl: z.string().url().optional().or(z.literal("")),
  soundcloudUrl: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

type ArtistFormData = z.infer<typeof artistFormSchema>;

interface AddArtistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddArtistDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddArtistDialogProps) {
  const { user, loading: authLoading } = useAuth();
  const { data: canEdit = false, isLoading: isLoadingPermissions } =
    useUserPermissionsQuery(user?.id, "edit_artists");

  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // React Query hooks
  const { data: genres } = useGenresQuery();
  const createArtistMutation = useCreateArtistMutation();
  const updateArtistMutation = useUpdateArtistMutation();

  // Form setup
  const form = useForm<ArtistFormData>({
    resolver: zodResolver(artistFormSchema),
    defaultValues: {
      name: "",
      description: "",
      genre_ids: [],
      spotifyUrl: "",
      soundcloudUrl: "",
      imageUrl: "",
    },
  });

  if (authLoading || isLoadingPermissions) {
    return null;
  }

  async function onSubmit(data: ArtistFormData) {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add an artist",
        variant: "destructive",
      });
      return;
    }

    // Check Core team permissions
    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "Only Core team members can add artists",
        variant: "destructive",
      });
      return;
    }

    try {
      // Determine the image URL - prioritize uploaded file over URL input
      let imageUrl = data.imageUrl || null;

      // Upload image if a file is selected
      if (logoFile) {
        try {
          // Create a temporary ID for upload (will be replaced when artist is created)
          const tempId = Date.now().toString();
          const uploadResult = await uploadArtistLogo(logoFile, tempId);
          imageUrl = uploadResult.url;
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          toast({
            title: "Warning",
            description: "Image upload failed, using URL instead",
            variant: "destructive",
          });
        }
      }

      // Create the artist with the final image URL
      const artistData = {
        name: data.name,
        description: data.description || "",
        genre_ids: data.genre_ids || [],
        added_by: user.id,
        spotify_url: data.spotifyUrl || null,
        soundcloud_url: data.soundcloudUrl || null,
        image_url: imageUrl,
      };

      await createArtistMutation.mutateAsync(artistData);

      form.reset();
      setLogoFile(null);
      onSuccess();
    } catch (error) {
      console.error("Failed to create artist:", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Add New Artist
          </DialogTitle>
          <DialogDescription>
            Add an artist to the Boom Festival voting list.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artist Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter artist name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="genre_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Genres</FormLabel>
                  <FormControl>
                    <GenreMultiSelect
                      genres={genres}
                      value={field.value || []}
                      onValueChange={field.onChange}
                      placeholder="Select genres..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about this artist..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="spotifyUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spotify URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://open.spotify.com/artist/..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="soundcloudUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SoundCloud URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://soundcloud.com/..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FileUpload
              onFileSelect={setLogoFile}
              currentImageUrl={null}
              accept="image/*"
              maxSize={5}
              disabled={createArtistMutation.isPending}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={
                createArtistMutation.isPending || updateArtistMutation.isPending
              }
            >
              {createArtistMutation.isPending || updateArtistMutation.isPending
                ? "Adding artist..."
                : "Add Artist"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

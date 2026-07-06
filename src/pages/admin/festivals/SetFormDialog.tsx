import { useEffect, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useArtistsQuery } from "@/api/artists/useArtists";
import { FestivalSet } from "@/api/sets/types";
import { useCreateSetMutation } from "@/api/sets/useCreateSet";
import { useUpdateSetMutation } from "@/api/sets/useUpdateSet";
import { useAddArtistToSetMutation } from "@/api/sets/useAddArtistToSet";
import { useRemoveArtistFromSetMutation } from "@/api/sets/useRemoveArtistFromSet";
import { useAuth } from "@/contexts/AuthContext";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ArtistMultiSelect } from "./SetsManagement/ArtistMultiSelect";
import {
  toDatetimeLocalInTimeZone,
  convertLocalTimeToUTC,
} from "@/lib/timeUtils";
import { StageSelector } from "./StageSelector";

// Form validation schema
const setFormSchema = z.object({
  name: z.string().min(1, "Set name is required"),
  description: z.string().optional(),
  stage_id: z.string().optional(),
  time_start: z.string().optional(),
  time_end: z.string().optional(),
  estimated_date: z.string().optional(),
  artist_ids: z.array(z.string()).optional(),
});

type SetFormData = z.infer<typeof setFormSchema>;

interface SetFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingSet: FestivalSet | null;
  editionId: string;
  timezone?: string;
}

export function SetFormDialog({
  isOpen,
  onClose,
  editingSet,
  editionId,
  timezone,
}: SetFormDialogProps) {
  const { data: artists = [] } = useArtistsQuery();
  const { user } = useAuth();
  const tz = timezone ?? "Europe/Lisbon";

  // Track if user has manually edited the name
  const [hasManuallyEditedName, setHasManuallyEditedName] = useState(false);
  const nameFieldRef = useRef<HTMLInputElement>(null);

  // React Query mutations
  const createSetMutation = useCreateSetMutation();
  const updateSetMutation = useUpdateSetMutation();
  const addArtistToSetMutation = useAddArtistToSetMutation();
  const removeArtistFromSetMutation = useRemoveArtistFromSetMutation();

  // Form setup
  const form = useForm<SetFormData>({
    resolver: zodResolver(setFormSchema),
    defaultValues: {
      name: "",
      description: "",
      stage_id: "none",
      time_start: "",
      time_end: "",
      estimated_date: "",
      artist_ids: [],
    },
  });

  // Reset form when dialog opens/closes or editingSet changes
  useEffect(() => {
    if (isOpen) {
      // Reset manual edit flag when dialog opens
      setHasManuallyEditedName(false);

      if (editingSet) {
        form.reset({
          name: editingSet.name,
          description: editingSet.description || "",
          stage_id: editingSet.stage_id || "none",
          time_start: toDatetimeLocalInTimeZone(editingSet.time_start, tz),
          time_end: toDatetimeLocalInTimeZone(editingSet.time_end, tz),
          estimated_date: "",
          artist_ids: editingSet.artists?.map((a) => a.id) || [],
        });
        // When editing, consider the name as manually set
        setHasManuallyEditedName(true);
      } else {
        form.reset({
          name: "",
          description: "",
          stage_id: "none",
          time_start: "",
          time_end: "",
          estimated_date: "",
          artist_ids: [],
        });
      }
    }
  }, [isOpen, editingSet, form, tz]);

  // Generate set name from selected artists
  const generateSetName = useCallback(
    (artistIds: string[]): string => {
      if (artistIds.length === 0) return "";

      const selectedArtists = artists.filter((artist) =>
        artistIds.includes(artist.id),
      );
      const artistNames = selectedArtists.map((artist) => artist.name);

      if (artistNames.length === 1) {
        return artistNames[0];
      } else if (artistNames.length === 2) {
        return `${artistNames[0]} vs ${artistNames[1]}`;
      } else if (artistNames.length > 2) {
        return `${artistNames[0]} + ${artistNames.length - 1} more`;
      }

      return "";
    },
    [artists],
  );

  async function onSubmit(data: SetFormData) {
    if (!user) {
      return; // Should not happen if user is authenticated
    }

    const submitData = {
      name: data.name,
      description: data.description || null,
      festival_edition_id: editionId,
      stage_id:
        data.stage_id && data.stage_id !== "none" ? data.stage_id : null,
      time_start: data.time_start
        ? convertLocalTimeToUTC(data.time_start, tz)
        : null,
      time_end: data.time_end
        ? convertLocalTimeToUTC(data.time_end, tz)
        : null,
    };

    let setId: string;
    if (editingSet) {
      const updatedSet = await updateSetMutation.mutateAsync({
        id: editingSet.id,
        updates: submitData,
      });
      setId = updatedSet.id;
    } else {
      const newSet = await createSetMutation.mutateAsync({
        ...submitData,
        created_by: user.id,
      });
      setId = newSet.id;
    }

    // Update artist associations
    const selectedArtistIds = data.artist_ids || [];
    const existingArtistIds = editingSet?.artists?.map((a) => a.id) || [];

    // Remove artists that are no longer selected
    const artistsToRemove = existingArtistIds.filter(
      (id) => !selectedArtistIds.includes(id),
    );
    for (const artistId of artistsToRemove) {
      await removeArtistFromSetMutation.mutateAsync({
        setId: editingSet!.id,
        artistId,
      });
    }

    // Add newly selected artists
    const artistsToAdd = selectedArtistIds.filter(
      (id) => !existingArtistIds.includes(id),
    );
    for (const artistId of artistsToAdd) {
      await addArtistToSetMutation.mutateAsync({ setId, artistId });
    }

    form.reset();
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingSet ? "Edit Set" : "Create New Set"}
          </DialogTitle>
          <DialogDescription>
            {editingSet
              ? "Update the set details, artists, and scheduling information."
              : "Create a new set by first selecting artists, then configuring details and scheduling."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Artist Selection - First Step */}
            <FormField
              control={form.control}
              name="artist_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artists in Set</FormLabel>
                  <FormControl>
                    <ArtistMultiSelect
                      artists={artists.map((a) => ({ id: a.id, name: a.name }))}
                      value={field.value || []}
                      onValueChange={(artistIds) => {
                        field.onChange(artistIds);
                        // Auto-generate name if user hasn't manually edited it
                        if (!hasManuallyEditedName) {
                          const generatedName = generateSetName(artistIds);
                          form.setValue("name", generatedName, {
                            shouldValidate: true,
                          });
                        }
                      }}
                      placeholder="Select artists for this set..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Set Name - Auto-generated but editable */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Set Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Shpongle Live Set"
                      {...field}
                      ref={nameFieldRef}
                      onChange={(e) => {
                        field.onChange(e);
                        setHasManuallyEditedName(true);
                      }}
                    />
                  </FormControl>
                  {!hasManuallyEditedName && (
                    <p className="text-xs text-muted-foreground">
                      Name will be auto-generated from selected artists
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stage_id"
              render={({ field }) => (
                <StageSelector
                  editionId={editionId}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Set description..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-xs text-muted-foreground">
              Times in {tz}
            </p>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="time_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimated_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        placeholder="If exact time unknown"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use when exact start/end times are unknown
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={
                  !user ||
                  createSetMutation.isPending ||
                  updateSetMutation.isPending ||
                  addArtistToSetMutation.isPending ||
                  removeArtistFromSetMutation.isPending
                }
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !user ||
                  createSetMutation.isPending ||
                  updateSetMutation.isPending ||
                  addArtistToSetMutation.isPending ||
                  removeArtistFromSetMutation.isPending
                }
              >
                {(createSetMutation.isPending ||
                  updateSetMutation.isPending ||
                  addArtistToSetMutation.isPending ||
                  removeArtistFromSetMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingSet ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

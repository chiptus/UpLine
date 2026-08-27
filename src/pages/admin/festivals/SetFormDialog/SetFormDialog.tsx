import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useArtistsQuery } from "@/api/artists/useArtists";
import { FestivalSet } from "@/api/sets/types";
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
import { Textarea } from "@/components/ui/textarea";
import { toDatetimeLocalInTimeZone } from "@/lib/timeUtils";
import { StageSelector } from "../StageSelector";
import { setFormSchema, SetFormData } from "./setFormSchema";
import { generateSetName } from "./generateSetName";
import { useSetFormSubmit } from "./useSetFormSubmit";
import { ArtistSelectionField } from "./ArtistSelectionField";
import { SetNameField } from "./SetNameField";
import { SetTimingFields } from "./SetTimingFields";
import { SetFormFooter } from "./SetFormFooter";

interface SetFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingSet: FestivalSet | null;
  editionId: string;
  timezone?: string;
}

const emptyFormValues: SetFormData = {
  name: "",
  description: "",
  stage_id: "none",
  time_start: "",
  time_end: "",
  estimated_date: "",
  artist_ids: [],
};

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

  const [hasManuallyEditedName, setHasManuallyEditedName] = useState(false);

  const { submit, isPending } = useSetFormSubmit({
    editingSet,
    editionId,
    timezone: tz,
    userId: user?.id,
    onComplete: handleSubmitComplete,
  });

  const form = useForm<SetFormData>({
    resolver: zodResolver(setFormSchema),
    defaultValues: emptyFormValues,
  });

  // Reset form when dialog opens/closes or editingSet changes
  useEffect(() => {
    if (isOpen) {
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
        form.reset(emptyFormValues);
      }
    }
  }, [isOpen, editingSet, form, tz]);

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
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <ArtistSelectionField
              control={form.control}
              artists={artists.map((a) => ({ id: a.id, name: a.name }))}
              onArtistsChange={handleArtistsChange}
            />

            <SetNameField
              control={form.control}
              hasManuallyEditedName={hasManuallyEditedName}
              onManualEdit={() => setHasManuallyEditedName(true)}
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

            <SetTimingFields control={form.control} timezone={tz} />

            <SetFormFooter
              isEditing={!!editingSet}
              disabled={!user || isPending}
              isPending={isPending}
              onCancel={onClose}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );

  function handleArtistsChange(artistIds: string[]) {
    // Auto-generate name if user hasn't manually edited it
    if (!hasManuallyEditedName) {
      const generatedName = generateSetName(artists, artistIds);
      form.setValue("name", generatedName, { shouldValidate: true });
    }
  }

  function handleSubmitComplete() {
    form.reset();
    onClose();
  }
}

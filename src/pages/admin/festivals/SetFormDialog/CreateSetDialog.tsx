import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useArtistsQuery } from "@/api/artists/useArtists";
import { isNonMusicSetType, type SetType } from "@/api/sets/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import {
  setFormSchema,
  SetFormData,
  setFormDefaultValues,
} from "./setFormSchema";
import { generateSetName } from "./generateSetName";
import { useCreateSetSubmit } from "./useCreateSetSubmit";
import { SetFormFields } from "./SetFormFields";
import { SetFormFooter } from "./SetFormFooter";

interface CreateSetDialogProps {
  onClose: () => void;
  editionId: string;
  timezone?: string;
}

export function CreateSetDialog({
  onClose,
  editionId,
  timezone,
}: CreateSetDialogProps) {
  const { data: artists = [] } = useArtistsQuery();
  const { user } = useAuth();
  const tz = timezone ?? "Europe/Lisbon";

  const [hasManuallyEditedName, setHasManuallyEditedName] = useState(false);

  const { submit, isPending } = useCreateSetSubmit({
    editionId,
    timezone: tz,
    userId: user?.id,
    onComplete: onClose,
  });

  const form = useForm<SetFormData>({
    resolver: zodResolver(setFormSchema),
    defaultValues: setFormDefaultValues,
  });

  const setType = useWatch({ control: form.control, name: "set_type" });
  const isNonMusicSet = isNonMusicSetType(setType);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Set</DialogTitle>
          <DialogDescription>
            Create a new set by picking its type, then configuring details and
            scheduling.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <SetFormFields
              control={form.control}
              artists={artists.map((a) => ({ id: a.id, name: a.name }))}
              editionId={editionId}
              timezone={tz}
              isNonMusicSet={isNonMusicSet}
              onTypeChange={handleTypeChange}
              hasManuallyEditedName={hasManuallyEditedName}
              onManualNameEdit={() => setHasManuallyEditedName(true)}
              onArtistsChange={handleArtistsChange}
            />

            <SetFormFooter
              submitLabel="Create"
              disabled={!user || isPending}
              isPending={isPending}
              onCancel={onClose}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );

  function handleTypeChange(setType: SetType) {
    if (hasManuallyEditedName) return;
    form.setValue(
      "name",
      generateSetName(setType, artists, form.getValues("artist_ids") || []),
      { shouldValidate: true },
    );
  }

  // Auto-generate name from artists; music sets only
  function handleArtistsChange(artistIds: string[]) {
    if (hasManuallyEditedName) return;
    if (form.getValues("set_type") !== "music") return;
    form.setValue(
      "name",
      generateSetName(form.getValues("set_type"), artists, artistIds),
      { shouldValidate: true },
    );
  }
}

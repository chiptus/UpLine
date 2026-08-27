import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useArtistsQuery } from "@/api/artists/useArtists";
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Set</DialogTitle>
          <DialogDescription>
            Create a new set by first selecting artists, then configuring
            details and scheduling.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <SetFormFields
              control={form.control}
              artists={artists.map((a) => ({ id: a.id, name: a.name }))}
              editionId={editionId}
              timezone={tz}
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

  function handleArtistsChange(artistIds: string[]) {
    // Auto-generate name if user hasn't manually edited it
    if (!hasManuallyEditedName) {
      const generatedName = generateSetName(artists, artistIds);
      form.setValue("name", generatedName, { shouldValidate: true });
    }
  }
}

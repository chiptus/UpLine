import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useArtistsQuery } from "@/api/artists/useArtists";
import { FestivalSet, isNonMusicSetType } from "@/api/sets/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { toDatetimeLocalInTimeZone } from "@/lib/timeUtils";
import { setFormSchema, SetFormData } from "./setFormSchema";
import { useUpdateSetSubmit } from "./useUpdateSetSubmit";
import { SetFormFields } from "./SetFormFields";
import { SetFormFooter } from "./SetFormFooter";

interface EditSetDialogProps {
  set: FestivalSet;
  onClose: () => void;
  editionId: string;
  timezone?: string;
}

export function EditSetDialog({
  set,
  onClose,
  editionId,
  timezone,
}: EditSetDialogProps) {
  const { data: artists = [] } = useArtistsQuery();
  const { user } = useAuth();
  const tz = timezone ?? "Europe/Lisbon";

  const { submit, isPending } = useUpdateSetSubmit({
    set,
    editionId,
    timezone: tz,
    onComplete: onClose,
  });

  const form = useForm<SetFormData>({
    resolver: zodResolver(setFormSchema),
    defaultValues: {
      set_type: set.set_type,
      name: set.name,
      description: set.description || "",
      external_url: set.external_url || "",
      stage_id: set.stage_id || "none",
      time_start: toDatetimeLocalInTimeZone(set.time_start, tz),
      time_end: toDatetimeLocalInTimeZone(set.time_end, tz),
      estimated_date: "",
      artist_ids: set.artists?.map((a) => a.id) || [],
    },
  });

  const setType = useWatch({ control: form.control, name: "set_type" });
  const isNonMusicSet = isNonMusicSetType(setType);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Set</DialogTitle>
          <DialogDescription>
            Update the set details, artists, and scheduling information.
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
            />

            <SetFormFooter
              submitLabel="Update"
              disabled={!user || isPending}
              isPending={isPending}
              onCancel={onClose}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

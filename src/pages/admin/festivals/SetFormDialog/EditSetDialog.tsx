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
      name: set.name,
      description: set.description || "",
      stage_id: set.stage_id || "none",
      time_start: toDatetimeLocalInTimeZone(set.time_start, tz),
      time_end: toDatetimeLocalInTimeZone(set.time_end, tz),
      estimated_date: "",
      artist_ids: set.artists?.map((a) => a.id) || [],
    },
  });

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

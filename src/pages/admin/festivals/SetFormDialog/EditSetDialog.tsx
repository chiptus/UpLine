import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useArtistsQuery } from "@/api/artists/useArtists";
import { FestivalSet, isNonMusicSetType } from "@/api/sets/types";
import { useSetSlugTakenQuery } from "@/api/sets/useSetSlugTaken";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useCheckableSlug } from "@/hooks/useCheckableSlug";
import { SLUG_TAKEN_MESSAGE } from "@/lib/slug";
import { toDatetimeLocalInTimeZone } from "@/lib/timeUtils";
import { editSetFormSchema, SetFormData } from "./setFormSchema";
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
    onSlugTaken: markSlugTaken,
  });

  const form = useForm<SetFormData>({
    resolver: zodResolver(editSetFormSchema),
    defaultValues: {
      set_type: set.set_type,
      name: set.name,
      slug: set.slug,
      description: set.description || "",
      external_url: set.external_url || "",
      stage_id: set.stage_id || "none",
      status: set.status,
      time_start: toDatetimeLocalInTimeZone(set.time_start, tz),
      time_end: toDatetimeLocalInTimeZone(set.time_end, tz),
      tba_date: toDatetimeLocalInTimeZone(set.time_start, tz).slice(0, 10),
      artist_ids: set.artists?.map((a) => a.id) || [],
    },
  });

  function submitUnlessTaken(data: SetFormData) {
    if (!isSlugTaken) submit(data);
  }

  function markSlugTaken() {
    form.setError("slug", { message: SLUG_TAKEN_MESSAGE });
  }

  const slug = useWatch({ control: form.control, name: "slug" });
  const checkableSlug = useCheckableSlug(slug ?? "", set.slug);
  const { data: taken } = useSetSlugTakenQuery(
    { editionId, slug: checkableSlug ?? "", excludeSetId: set.id },
    { enabled: checkableSlug !== null },
  );
  const isSlugTaken = checkableSlug !== null && taken === true;

  const setType = useWatch({ control: form.control, name: "set_type" });
  const isNonMusicSet = isNonMusicSetType(setType);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Set</DialogTitle>
          <DialogDescription>
            Update the set details, artists, and scheduling information.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            onSubmit={form.handleSubmit(submitUnlessTaken)}
            className="space-y-4"
          >
            <SetFormFields
              control={form.control}
              artists={artists.map((a) => ({ id: a.id, name: a.name }))}
              editionId={editionId}
              timezone={tz}
              isNonMusicSet={isNonMusicSet}
              showSlugField
              isSlugTaken={isSlugTaken}
            />

            <SetFormFooter
              submitLabel="Update"
              disabled={!user || isPending}
              submitDisabled={isSlugTaken}
              isPending={isPending}
              onCancel={onClose}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

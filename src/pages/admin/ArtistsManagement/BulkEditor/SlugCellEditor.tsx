import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useArtistSlugTakenQuery } from "@/api/artists/useArtistSlugTaken";
import { SlugFromNameButton } from "@/components/SlugFromNameButton";
import { Input } from "@/components/ui/input";
import { useCheckableSlug } from "@/hooks/useCheckableSlug";
import { generateSlug, SLUG_TAKEN_MESSAGE } from "@/lib/slug";
import { slugFieldSchema } from "@/lib/slugFieldSchema";

const slugCellSchema = z.object({ slug: slugFieldSchema });

type SlugCellData = z.infer<typeof slugCellSchema>;

export interface SlugSaveCallbacks {
  onSuccess: () => void;
  onError: (error: Error) => void;
}

interface SlugCellEditorProps {
  artistId: string;
  name: string;
  value: string;
  onSave: (slug: string, callbacks: SlugSaveCallbacks) => void;
  onClose: () => void;
}

export function SlugCellEditor({
  artistId,
  name,
  value,
  onSave,
  onClose,
}: SlugCellEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<SlugCellData>({
    resolver: zodResolver(slugCellSchema),
    defaultValues: { slug: value },
  });
  const slug = useWatch({ control: form.control, name: "slug" });
  const checkableSlug = useCheckableSlug(slug, value);
  const { data: taken } = useArtistSlugTakenQuery(
    { slug: checkableSlug ?? "", excludeArtistId: artistId },
    { enabled: checkableSlug !== null },
  );
  const isTaken = checkableSlug !== null && taken === true;
  const error =
    form.formState.errors.slug?.message ??
    (isTaken ? SLUG_TAKEN_MESSAGE : undefined);

  return (
    <form
      noValidate
      className="min-w-40 space-y-1"
      onSubmit={form.handleSubmit(submit)}
    >
      <div className="flex items-center gap-1">
        <Input
          {...form.register("slug")}
          onKeyDown={onKeyDown}
          className="text-sm font-mono"
          aria-label="Artist slug"
          aria-invalid={!!error}
          readOnly={isSaving}
          autoFocus
        />
        <SlugFromNameButton
          disabled={isSaving || !name.trim() || slug === generateSlug(name)}
          onClick={regenerateFromName}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );

  function regenerateFromName() {
    form.setValue("slug", generateSlug(name), { shouldValidate: true });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    // A started save can't be aborted, so cancelling would only hide it.
    if (e.key === "Escape" && !isSaving) onClose();
  }

  function submit(data: SlugCellData) {
    if (isSaving || isTaken) return;
    if (data.slug === value) {
      onClose();
      return;
    }

    // Stay open until the save lands so a unique violation that slipped past
    // the lookup (still debouncing, or raced) can be shown inline.
    setIsSaving(true);
    onSave(data.slug, {
      onSuccess: onClose,
      onError: (error) => {
        setIsSaving(false);
        form.setError("slug", { message: error.message });
      },
    });
  }
}

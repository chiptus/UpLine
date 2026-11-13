import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isArtistSlugTaken } from "@/api/artists/isArtistSlugTaken";
import { Input } from "@/components/ui/input";
import { SLUG_TAKEN_MESSAGE } from "@/lib/slug";
import { slugFieldSchema } from "@/lib/slugFieldSchema";

const slugCellSchema = z.object({ slug: slugFieldSchema });

type SlugCellData = z.infer<typeof slugCellSchema>;

interface SlugCellProps {
  artistId: string;
  value: string;
  onSave: (slug: string) => void;
}

export function SlugCell({ artistId, value, onSave }: SlugCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const form = useForm<SlugCellData>({
    resolver: zodResolver(slugCellSchema),
    defaultValues: { slug: value },
  });
  const error = form.formState.errors.slug?.message;

  if (!isEditing) {
    return (
      <div
        className="cursor-pointer hover:bg-surface-active p-1 rounded min-h-6 text-sm font-mono"
        onClick={startEditing}
        title="Click to edit"
      >
        {value}
      </div>
    );
  }

  return (
    <form
      noValidate
      className="min-w-40 space-y-1"
      onSubmit={form.handleSubmit(submit)}
    >
      <Input
        {...form.register("slug")}
        onKeyDown={onKeyDown}
        className="text-sm font-mono"
        aria-label="Artist slug"
        aria-invalid={!!error}
        autoFocus
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );

  function startEditing() {
    form.reset({ slug: value });
    setIsEditing(true);
  }

  function cancel() {
    form.reset({ slug: value });
    setIsEditing(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") cancel();
  }

  async function submit(data: SlugCellData) {
    if (data.slug === value) {
      cancel();
      return;
    }

    // A failed lookup falls through: the unique constraint is the backstop.
    const taken = await isArtistSlugTaken({
      slug: data.slug,
      excludeArtistId: artistId,
    }).catch(() => false);
    if (taken) {
      form.setError("slug", { message: SLUG_TAKEN_MESSAGE });
      return;
    }

    onSave(data.slug);
    setIsEditing(false);
  }
}

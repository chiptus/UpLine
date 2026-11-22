import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isArtistSlugTaken } from "@/api/artists/isArtistSlugTaken";
import { Input } from "@/components/ui/input";
import { SLUG_TAKEN_MESSAGE } from "@/lib/slug";
import { slugFieldSchema } from "@/lib/slugFieldSchema";

const slugCellSchema = z.object({ slug: slugFieldSchema });

type SlugCellData = z.infer<typeof slugCellSchema>;

export interface SlugSaveCallbacks {
  onSuccess: () => void;
  onError: (error: Error) => void;
}

interface SlugCellEditorProps {
  artistId: string;
  value: string;
  onSave: (slug: string, callbacks: SlugSaveCallbacks) => void;
  onClose: () => void;
}

/** Mounted only while editing, so form state resets by unmounting. */
export function SlugCellEditor({
  artistId,
  value,
  onSave,
  onClose,
}: SlugCellEditorProps) {
  const [phase, setPhase] = useState<"idle" | "checking" | "saving">("idle");
  const lookupAbort = useRef<AbortController | null>(null);
  const form = useForm<SlugCellData>({
    resolver: zodResolver(slugCellSchema),
    defaultValues: { slug: value },
  });
  const error = form.formState.errors.slug?.message;

  useEffect(() => () => lookupAbort.current?.abort(), []);

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
        readOnly={phase !== "idle"}
        autoFocus
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );

  function onKeyDown(e: React.KeyboardEvent) {
    // A started save can't be aborted, so cancelling would only hide it.
    if (e.key === "Escape" && phase !== "saving") onClose();
  }

  async function submit(data: SlugCellData) {
    if (phase !== "idle") return;
    if (data.slug === value) {
      onClose();
      return;
    }

    const abort = new AbortController();
    lookupAbort.current = abort;
    setPhase("checking");

    // A failed lookup falls through: the unique constraint is the backstop.
    const taken = await isArtistSlugTaken({
      slug: data.slug,
      excludeArtistId: artistId,
      signal: abort.signal,
    }).catch(() => false);
    if (abort.signal.aborted) return;

    if (taken) {
      setPhase("idle");
      form.setError("slug", { message: SLUG_TAKEN_MESSAGE });
      return;
    }

    // Stay open until the save lands so a raced unique violation can still be
    // shown inline.
    setPhase("saving");
    onSave(data.slug, {
      onSuccess: onClose,
      onError: (error) => {
        setPhase("idle");
        form.setError("slug", { message: error.message });
      },
    });
  }
}

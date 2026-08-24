import { Button } from "@/components/ui/button";
import { confirm } from "@/hooks/use-confirm";
import { SetNote } from "@/api/artist-notes/types";
import { useDeleteNoteMutation } from "@/api/artist-notes/useDeleteNoteMutation";
import { Trash2Icon } from "lucide-react";
import { formatDateOnly } from "@/lib/timeUtils";

export function SetNoteItem({
  isOwn,
  note,
}: {
  isOwn: boolean;
  note: SetNote;
}) {
  const deleteNoteMutation = useDeleteNoteMutation();

  return (
    <div className="bg-surface rounded-lg p-4 border">
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm text-subtle-foreground">
          By: {note.author_username || note.author_email || "Unknown User"}
        </div>
        {isOwn && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            disabled={deleteNoteMutation.isPending}
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="text-foreground whitespace-pre-wrap break-words mb-2">
        {note.note_content}
      </div>
      <div className="text-xs text-accent-soft-foreground">
        {formatDateOnly(note.updated_at)}
      </div>
    </div>
  );

  async function handleDelete() {
    const confirmed = await confirm({
      title: "Delete this note?",
      description:
        "Are you sure you want to delete this note? This action cannot be undone.",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    deleteNoteMutation.mutate(note.id);
  }
}

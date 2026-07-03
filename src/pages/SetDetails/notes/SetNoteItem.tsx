import { Button } from "@/components/ui/button";
import { SetNote } from "@/api/artist-notes/types";
import { useDeleteNoteMutation } from "@/api/artist-notes/useDeleteNoteMutation";
import { Trash2Icon } from "lucide-react";

export function SetNoteItem({
  isOwn,
  note,
}: {
  isOwn: boolean;
  note: SetNote;
}) {
  const deleteNoteMutation = useDeleteNoteMutation();

  return (
    <div className="bg-white/5 rounded-lg p-4 border border-purple-400/20">
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm text-purple-300">
          By: {note.author_username || note.author_email || "Unknown User"}
        </div>
        {isOwn && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(note.id)}
            className="border-red-400/50 text-red-400 hover:bg-red-400 hover:text-white"
            disabled={deleteNoteMutation.isPending}
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="text-white whitespace-pre-wrap break-words mb-2">
        {note.note_content}
      </div>
      <div className="text-xs text-purple-400">
        {new Date(note.updated_at).toLocaleDateString()}
      </div>
    </div>
  );

  async function handleDelete(noteId: string) {
    if (window.confirm("Are you sure you want to delete this note?")) {
      deleteNoteMutation.mutate(noteId, {});
    }
  }
}

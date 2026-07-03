import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateNoteMutation } from "@/api/artist-notes/useCreateNoteMutation";
import { SaveIcon, XIcon } from "lucide-react";
import { useState } from "react";

export function CreateNoteForm({
  onSuccess,
  userId,
  setId,
}: {
  onSuccess(): void;
  userId: string;
  setId: string;
}) {
  const mutation = useCreateNoteMutation();

  const [noteContent, setNoteContent] = useState("");

  return (
    <div className="space-y-4">
      <Textarea
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        placeholder="Add your thoughts about this artist..."
        className="min-h-[120px] bg-white/5 border-purple-400/30 text-white placeholder:text-purple-300"
      />
      <div className="flex items-center space-x-2">
        <Button
          onClick={handleSave}
          disabled={mutation.isPending || !noteContent.trim()}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <SaveIcon className="h-4 w-4 mr-2" />
          {mutation.isPending ? "Saving..." : "Save Note"}
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={mutation.isPending}
          className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
        >
          <XIcon className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );

  async function handleSave() {
    if (!userId) {
      return;
    }

    mutation.mutate(
      { setId, userId, noteContent: noteContent.trim() },
      {
        onSuccess() {
          onSuccess();
          setNoteContent("");
        },
      },
    );
  }

  function handleCancel() {
    setNoteContent("");
    onSuccess();
  }
}

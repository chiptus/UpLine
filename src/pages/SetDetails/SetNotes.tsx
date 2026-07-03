import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit3, StickyNote } from "lucide-react";
import { useArtistNotesQuery } from "@/api/artist-notes/useArtistNotes";
import { SetNoteItem } from "./notes/SetNoteItem";
import { CreateNoteForm } from "./notes/CreateNoteForm";

interface SetNotesProps {
  setId: string;
  userId: string | null;
}

export function SetNotes({ setId, userId }: SetNotesProps) {
  const notesQuery = useArtistNotesQuery(setId);

  const [isEditing, setIsEditing] = useState(false);

  const notes = notesQuery.data;

  if (!userId) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-purple-400/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <StickyNote className="h-5 w-5" />
            <span>Group Notes</span>
          </CardTitle>
          <CardDescription className="text-purple-200">
            Sign in to add notes and see notes from group members
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (notesQuery.isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-purple-400/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <StickyNote className="h-5 w-5" />
            <span>Group Notes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-purple-200">Loading notes...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-purple-400/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2 text-white">
              <StickyNote className="h-5 w-5" />
              <span>Group Notes</span>
            </CardTitle>
            <CardDescription className="text-purple-200">
              Notes from you and group members about this artist
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <CreateNoteForm
            userId={userId}
            setId={setId}
            onSuccess={() => setIsEditing(false)}
          />
        ) : (
          <div className="space-y-6">
            {!!notes?.length && (
              <div className="space-y-4">
                {notes.map((note) => {
                  return (
                    <SetNoteItem
                      isOwn={note.user_id === userId}
                      key={note.id}
                      note={note}
                    />
                  );
                })}
              </div>
            )}

            <div className="text-center py-4 border-t border-purple-400/20">
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

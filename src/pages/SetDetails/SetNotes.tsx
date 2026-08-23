import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit3, StickyNote } from "lucide-react";
import { artistNotesQuery } from "@/api/artist-notes/useArtistNotes";
import { SetNoteItem } from "./notes/SetNoteItem";
import { CreateNoteForm } from "./notes/CreateNoteForm";

interface SetNotesProps {
  setId: string;
  userId: string | null;
}

export function SetNotes({ setId, userId }: SetNotesProps) {
  const { data: notes } = useSuspenseQuery(artistNotesQuery(setId));

  const [isEditing, setIsEditing] = useState(false);

  if (!userId) {
    return (
      <Card className="bg-surface-raised backdrop-blur-md border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-foreground">
            <StickyNote className="h-5 w-5" />
            <span>Group Notes</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to add notes and see notes from group members
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-surface-raised backdrop-blur-md border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2 text-foreground">
              <StickyNote className="h-5 w-5" />
              <span>Group Notes</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground">
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

            <div className="text-center py-4 border-t border-border">
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-accent hover:bg-purple-700"
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

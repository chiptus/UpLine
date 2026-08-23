import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { Festival } from "@/api/festivals/types";
import { FestivalDialog } from "./FestivalDialog";
import { FestivalManagementTable } from "./FestivalManagementTable";

interface FestivalManagementSectionProps {
  selected: string;
  onSelect: (festival: Festival) => void;
}

export function FestivalManagementSection({
  selected,
  onSelect,
}: FestivalManagementSectionProps) {
  const [editingFestival, setEditingFestival] = useState<
    Festival | "new" | null
  >(null);

  function handleCreate() {
    setEditingFestival("new");
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Festival Management
            </span>

            <Button
              onClick={handleCreate}
              className="bg-accent text-accent-foreground hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Festival
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FestivalManagementTable
            onEdit={(festival) => {
              setEditingFestival(festival);
            }}
            onSelect={onSelect}
            selected={selected}
          />
        </CardContent>
      </Card>

      {editingFestival && (
        <FestivalDialog
          open
          onOpenChange={() => {
            setEditingFestival(null);
          }}
          editingFestival={editingFestival === "new" ? null : editingFestival}
        />
      )}
    </>
  );
}

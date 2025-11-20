import { useState } from "react";
import { Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus } from "lucide-react";
import { FestivalDialog } from "./FestivalDialog";
import { FestivalManagementTable } from "./FestivalManagementTable";
import { Festival } from "@/hooks/queries/festivals/types";
import { Button } from "@/components/ui/button";

export default function AdminFestivals() {
  const [editingFestival, setEditingFestival] = useState<Festival | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const navigate = useNavigate();
  const { festivalSlug = "" } = useParams({ strict: false });

  function handleFestivalChange(festivalSlug: string) {
    if (festivalSlug === "none") {
      navigate({ to: "/admin/festivals" });
    } else {
      navigate({ to: "/admin/festivals/$festivalSlug", params: { festivalSlug } });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Festival Management
            </span>

            <Button
              onClick={handleCreate}
              className="bg-purple-600 hover:bg-purple-700"
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
              setIsEditDialogOpen(true);
            }}
            onSelect={(festival) => {
              handleFestivalChange(festival.slug);
            }}
            selected={festivalSlug}
          />
        </CardContent>
      </Card>

      <div className="mt-4">
        <Outlet />
      </div>

      <FestivalDialog
        open={isEditDialogOpen}
        onOpenChange={() => {
          setEditingFestival(null);
          setIsEditDialogOpen(false);
        }}
        editingFestival={editingFestival}
      />
    </div>
  );

  function handleCreate() {
    setEditingFestival(null);
    setIsEditDialogOpen(true);
  }
}

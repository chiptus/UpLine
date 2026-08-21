import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus } from "lucide-react";
import { FestivalDialog } from "@/pages/admin/festivals/FestivalDialog";
import { FestivalManagementTable } from "@/pages/admin/festivals/FestivalManagementTable";
import { Festival } from "@/api/festivals/types";
import { Button } from "@/components/ui/button";
import { festivalsQuery } from "@/api/festivals/useFestivals";
import { useFestivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { pageMeta } from "@/lib/pageHead";

export const Route = createFileRoute("/admin/festivals")({
  component: AdminFestivals,
  head: () => ({
    meta: pageMeta({ title: "Festivals", prefix: "Admin" }),
  }),
  loader: async ({ context }) => {
    void context.queryClient.ensureQueryData(festivalsQuery({ all: true }));
  },
});

function AdminFestivals() {
  const [editingFestival, setEditingFestival] = useState<Festival | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const navigate = useNavigate();
  const { festivalSlug = "" } = useParams({ strict: false });
  const [showFestivalsList, setShowFestivalsList] = useState(!festivalSlug);
  const selectedFestivalQuery = useFestivalBySlugQuery(festivalSlug);

  useEffect(() => {
    setShowFestivalsList(!festivalSlug);
  }, [festivalSlug]);

  function handleFestivalChange(festivalSlug: string) {
    if (festivalSlug === "none") {
      navigate({ to: "/admin/festivals" });
    } else {
      navigate({
        to: "/admin/festivals/$festivalSlug",
        params: { festivalSlug },
      });
    }
    setShowFestivalsList(false);
  }

  return (
    <div className="space-y-6">
      {showFestivalsList ? (
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
      ) : (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <span className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Festival:{" "}
              <span className="font-medium">
                {selectedFestivalQuery.data?.name ?? festivalSlug}
              </span>
            </span>
            <Button
              variant="outline"
              onClick={() => setShowFestivalsList(true)}
            >
              Change Festival
            </Button>
          </CardContent>
        </Card>
      )}

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

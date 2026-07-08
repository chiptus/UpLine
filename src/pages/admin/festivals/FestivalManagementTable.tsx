import { useFestivalsQuery } from "@/api/festivals/useFestivals";
import { useDeleteFestivalMutation } from "@/api/festivals/useDeleteFestival";
import { Festival } from "@/api/festivals/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Edit2, Trash2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FestivalLogoDialog } from "./FestivalLogoDialog";
import { useState } from "react";

export function FestivalManagementTable({
  onEdit,
  onSelect,
  selected,
}: {
  onEdit: (festival: Festival) => void;
  onSelect: (festival: Festival) => void;
  selected: string;
}) {
  const {
    data: festivals = [],
    isLoading,
    isError,
    refetch,
  } = useFestivalsQuery({ all: true });
  const deleteFestivalMutation = useDeleteFestivalMutation();

  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [selectedFestivalForLogo, setSelectedFestivalForLogo] =
    useState<Festival | null>(null);

  function handleDelete(festival: Festival) {
    if (
      !confirm(
        `Are you sure you want to delete "${festival.name}"? This will also delete all associated editions, stages, and sets.`,
      )
    ) {
      return;
    }

    deleteFestivalMutation.mutate(festival.id);
  }

  function handleLogoManagement(festival: Festival) {
    setSelectedFestivalForLogo(festival);
    setLogoDialogOpen(true);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading festivals...</span>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 gap-4">
          <div className="text-center">
            <p className="text-red-600 font-medium mb-2">
              Error Loading Festivals
            </p>
            <p className="text-sm text-gray-600">
              There was an error loading the festivals. Please check your
              connection and try again.
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Logo</TableHead>
            <TableHead>Name</TableHead>

            <TableHead className="w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {festivals.map((festival) => (
            <TableRow
              key={festival.id}
              onClick={() => onSelect(festival)}
              className={cn(
                selected === festival.id ? "bg-slate-200 selected" : "",
              )}
            >
              <TableCell>
                {festival.logo_url ? (
                  <img
                    src={festival.logo_url}
                    alt={`${festival.name} logo`}
                    className="h-8 w-8 object-contain rounded"
                  />
                ) : (
                  <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{festival.name}</TableCell>

              <TableCell>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLogoManagement(festival);
                    }}
                    title="Manage logo"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit(festival);
                    }}
                    title="Edit festival"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(festival);
                    }}
                    className="text-destructive hover:text-destructive"
                    title="Delete festival"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {festivals.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No festivals found. Create your first festival to get started.
        </div>
      )}

      <FestivalLogoDialog
        open={logoDialogOpen}
        onOpenChange={setLogoDialogOpen}
        festival={selectedFestivalForLogo}
      />
    </>
  );
}

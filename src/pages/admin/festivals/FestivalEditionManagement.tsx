import { useState } from "react";
import { useFestivalEditionsForFestivalQuery } from "@/api/editions/useFestivalEditionsForFestival";
import { useFestivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { useCreateFestivalEditionMutation } from "@/api/editions/useCreateFestivalEdition";
import { useUpdateFestivalEditionMutation } from "@/api/editions/useUpdateFestivalEdition";
import { useDeleteFestivalEditionMutation } from "@/api/editions/useDeleteFestivalEdition";
import { FestivalEdition } from "@/api/editions/types";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { confirm } from "@/hooks/use-confirm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Edit2, Trash2, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateSlug, isValidSlug, sanitizeSlug } from "@/lib/slug";
import type { Database } from "@/integrations/supabase/types";
import { ScheduleRevealLevelField } from "./ScheduleRevealLevelField";

type RevealLevel = Database["public"]["Enums"]["schedule_reveal_level"];

interface EditionFormData {
  name: string;
  slug: string;
  year: number;
  start_date?: string;
  end_date?: string;
  published: boolean;
  schedule_reveal_level: RevealLevel;
}

export function FestivalEditionManagement({
  festivalSlug,
  onSelect,
  selected,
}: {
  festivalSlug: string;
  onSelect: (editionSlug: string) => void;
  selected: string;
}) {
  // All hooks must be at the top level
  const festivalQuery = useFestivalBySlugQuery(festivalSlug);
  const { data: editions = [], isLoading } =
    useFestivalEditionsForFestivalQuery(festivalQuery.data?.id, { all: true });
  const createEditionMutation = useCreateFestivalEditionMutation();
  const updateEditionMutation = useUpdateFestivalEditionMutation();
  const deleteEditionMutation = useDeleteFestivalEditionMutation();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEdition, setEditingEdition] = useState<FestivalEdition | null>(
    null,
  );
  const [formData, setFormData] = useState<EditionFormData>({
    name: "",
    slug: "",
    year: new Date().getFullYear(),
    start_date: "",
    end_date: "",
    published: false,
    schedule_reveal_level: "draft",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugError, setSlugError] = useState("");

  if (festivalQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading festival...</span>
        </CardContent>
      </Card>
    );
  }

  if (!festivalQuery.data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <span>Festival not found</span>
        </CardContent>
      </Card>
    );
  }

  function resetForm() {
    setFormData({
      name: "",
      slug: "",
      year: new Date().getFullYear(),
      start_date: "",
      end_date: "",
      published: false,
      schedule_reveal_level: "draft",
    });
    setEditingEdition(null);
    setSlugError("");
  }

  function handleCreate() {
    resetForm();
    setIsDialogOpen(true);
  }

  function handleEdit(edition: FestivalEdition) {
    setFormData({
      name: edition.name,
      slug: edition.slug || generateSlug(edition.name),
      year: edition.year,
      start_date: edition.start_date || "",
      end_date: edition.end_date || "",
      published: edition.published || false,
      schedule_reveal_level: edition.schedule_reveal_level ?? "draft",
    });
    setEditingEdition(edition);
    setSlugError("");
    setIsDialogOpen(true);
  }

  // Auto-generate slug when name changes
  function handleNameChange(name: string) {
    setFormData((prev) => ({
      ...prev,
      name,
      // Only auto-generate slug if it's empty or matches the generated slug from previous name
      slug:
        prev.slug === "" || prev.slug === generateSlug(prev.name)
          ? generateSlug(name)
          : prev.slug,
    }));
  }

  // Validate slug when it changes
  function handleSlugChange(slug: string) {
    const cleanSlug = sanitizeSlug(slug);
    setFormData((prev) => ({ ...prev, slug: cleanSlug }));

    if (cleanSlug && !isValidSlug(cleanSlug)) {
      setSlugError(
        "Slug must contain only lowercase letters, numbers, and hyphens",
      );
    } else {
      setSlugError("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Edition name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.slug.trim()) {
      toast({
        title: "Error",
        description: "Edition slug is required",
        variant: "destructive",
      });
      return;
    }

    if (!isValidSlug(formData.slug)) {
      toast({
        title: "Error",
        description: "Please enter a valid slug",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        festival_id: festivalQuery.data!.id,
      };

      if (editingEdition) {
        await updateEditionMutation.mutateAsync({
          editionId: editingEdition.id,
          editionData: submitData,
        });
      } else {
        await createEditionMutation.mutateAsync(submitData);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save festival edition",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteRequest(edition: FestivalEdition) {
    const confirmed = await confirm({
      title: "Delete this edition?",
      description: `Are you sure you want to delete "${edition.name}"? This will also delete all associated stages and sets.`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    deleteEditionMutation.mutate(edition.id);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading festival editions...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Editions
          </span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={handleCreate}
                className="bg-accent hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Edition
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingEdition
                    ? "Edit Festival Edition"
                    : "Create New Festival Edition"}
                </DialogTitle>
                <DialogDescription>
                  {editingEdition
                    ? "Update edition information including name, dates, and visibility settings."
                    : "Create a new festival edition with dates and publish settings."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Edition Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Boom Festival 2025"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="e.g., boom-2025"
                    required
                  />
                  {slugError && (
                    <p className="text-sm text-destructive mt-1">{slugError}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    This will be used in the URL:
                    /festivals/festival-name/editions/
                    {formData.slug || "your-slug"}
                  </p>
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year: parseInt(e.target.value),
                      })
                    }
                    min="2000"
                    max="2100"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, published: checked })
                    }
                  />
                  <Label htmlFor="published">Published</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.published
                      ? "Visible to public users"
                      : "Only visible to admins"}
                  </p>
                </div>
                <ScheduleRevealLevelField
                  value={formData.schedule_reveal_level}
                  onChange={(level) =>
                    setFormData({ ...formData, schedule_reveal_level: level })
                  }
                  editionPublished={formData.published}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingEdition ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Edition Name</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editions.map((edition) => (
                <TableRow
                  key={edition.id}
                  onClick={() => onSelect(edition.slug)}
                  className={cn(
                    selected === edition.slug ? "bg-slate-200 selected" : "",
                  )}
                >
                  <TableCell>{edition.name}</TableCell>
                  <TableCell>{edition.year}</TableCell>
                  <TableCell>{edition.start_date || "—"}</TableCell>
                  <TableCell>{edition.end_date || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEdit(edition);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteRequest(edition);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {editions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No festival editions found. Create your first edition to get
              started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

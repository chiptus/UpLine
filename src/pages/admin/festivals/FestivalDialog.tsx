import { useState, useEffect } from "react";
import { useCreateFestivalMutation } from "@/api/festivals/useCreateFestival";
import { useUpdateFestivalMutation } from "@/api/festivals/useUpdateFestival";
import { Festival } from "@/api/festivals/types";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { generateSlug, isValidSlug } from "@/lib/slug";
import { useSlugField } from "@/hooks/useSlugField";
import { TimezonePicker } from "@/components/Admin/ScheduleImport/TimezonePicker";

const DEFAULT_FESTIVAL_TIMEZONE = "Europe/Lisbon";

interface FestivalFormData {
  description?: string;
  published: boolean;
  timezone: string;
}

interface FestivalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingFestival: Festival | null;
}

export function FestivalDialog({
  open,
  onOpenChange,
  editingFestival,
}: FestivalDialogProps) {
  const createFestivalMutation = useCreateFestivalMutation();
  const updateFestivalMutation = useUpdateFestivalMutation();
  const { toast } = useToast();

  const {
    name,
    slug,
    slugError,
    changeName,
    changeSlug,
    reset: resetSlugField,
  } = useSlugField();
  const [formData, setFormData] = useState<FestivalFormData>({
    description: "",
    published: false,
    timezone: DEFAULT_FESTIVAL_TIMEZONE,
  });
  const isSubmitting =
    createFestivalMutation.isPending || updateFestivalMutation.isPending;

  // Reset form when dialog opens/closes or editing festival changes
  useEffect(() => {
    if (open) {
      if (editingFestival) {
        resetSlugField({
          name: editingFestival.name,
          slug: editingFestival.slug || generateSlug(editingFestival.name),
        });
        setFormData({
          description: editingFestival.description || "",
          published: editingFestival.published || false,
          timezone: editingFestival.timezone || DEFAULT_FESTIVAL_TIMEZONE,
        });
      } else {
        resetSlugField();
        setFormData({
          description: "",
          published: false,
          timezone: DEFAULT_FESTIVAL_TIMEZONE,
        });
      }
    }
  }, [open, editingFestival, resetSlugField]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Festival name is required",
        variant: "destructive",
      });
      return;
    }

    if (!slug.trim()) {
      toast({
        title: "Error",
        description: "Festival slug is required",
        variant: "destructive",
      });
      return;
    }

    if (!isValidSlug(slug)) {
      toast({
        title: "Error",
        description: "Please enter a valid slug",
        variant: "destructive",
      });
      return;
    }

    if (editingFestival) {
      updateFestivalMutation.mutate(
        {
          festivalId: editingFestival.id,
          festivalData: { ...formData, name, slug },
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createFestivalMutation.mutate(
        { ...formData, name, slug },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingFestival ? "Edit Festival" : "Create New Festival"}
          </DialogTitle>
          <DialogDescription>
            {editingFestival
              ? "Update festival information including name, description, and settings."
              : "Create a new festival with basic information and publish settings."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="name">Festival Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => changeName(e.target.value)}
              placeholder="e.g., Boom Festival"
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">URL Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => changeSlug(e.target.value)}
              placeholder="e.g., boom-festival"
              required
            />
            {slugError && (
              <p className="text-sm text-destructive mt-1">{slugError}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              This will be used in the URL: /festivals/
              {slug || "your-slug"}
            </p>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Short description for festival listings..."
              rows={3}
            />
          </div>
          <TimezonePicker
            value={formData.timezone}
            onChange={(timezone) =>
              setFormData((prev) => ({ ...prev, timezone }))
            }
            description="All schedule times for this festival are displayed in this timezone."
          />
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
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingFestival ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

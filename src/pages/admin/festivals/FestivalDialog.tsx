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
import { generateSlug, isValidSlug, sanitizeSlug } from "@/lib/slug";
import { TimezonePicker } from "@/components/Admin/ScheduleImport/TimezonePicker";

const DEFAULT_FESTIVAL_TIMEZONE = "Europe/Lisbon";
const DEFAULT_DAY_START_HOUR = 0;

interface FestivalFormData {
  name: string;
  slug: string;
  description?: string;
  published: boolean;
  timezone: string;
  day_start_hour: number;
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

  const [formData, setFormData] = useState<FestivalFormData>({
    name: "",
    slug: "",
    description: "",
    published: false,
    timezone: DEFAULT_FESTIVAL_TIMEZONE,
    day_start_hour: DEFAULT_DAY_START_HOUR,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugError, setSlugError] = useState("");

  // Reset form when dialog opens/closes or editing festival changes
  useEffect(() => {
    if (open) {
      if (editingFestival) {
        setFormData({
          name: editingFestival.name,
          slug: editingFestival.slug || generateSlug(editingFestival.name),
          description: editingFestival.description || "",
          published: editingFestival.published || false,
          timezone: editingFestival.timezone || DEFAULT_FESTIVAL_TIMEZONE,
          day_start_hour:
            editingFestival.day_start_hour ?? DEFAULT_DAY_START_HOUR,
        });
      } else {
        setFormData({
          name: "",
          slug: "",
          description: "",
          published: false,
          timezone: DEFAULT_FESTIVAL_TIMEZONE,
          day_start_hour: DEFAULT_DAY_START_HOUR,
        });
      }
      setSlugError("");
    }
  }, [open, editingFestival]);

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
        description: "Festival name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.slug.trim()) {
      toast({
        title: "Error",
        description: "Festival slug is required",
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
      if (editingFestival) {
        await updateFestivalMutation.mutateAsync({
          festivalId: editingFestival.id,
          festivalData: formData,
        });
      } else {
        await createFestivalMutation.mutateAsync(formData);
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save festival",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Festival Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Boom Festival"
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">URL Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="e.g., boom-festival"
              required
            />
            {slugError && (
              <p className="text-sm text-destructive mt-1">{slugError}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              This will be used in the URL: /festivals/
              {formData.slug || "your-slug"}
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
          <div>
            <Label htmlFor="dayStartHour">Day start hour</Label>
            <Input
              id="dayStartHour"
              type="number"
              min={0}
              max={23}
              value={formData.day_start_hour}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                const clamped = Number.isNaN(parsed)
                  ? DEFAULT_DAY_START_HOUR
                  : Math.min(23, Math.max(0, Math.trunc(parsed)));
                setFormData((prev) => ({
                  ...prev,
                  day_start_hour: clamped,
                }));
              }}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Sets before this hour (in the festival timezone) group under the
              previous festival day. 0 splits days at midnight.
            </p>
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

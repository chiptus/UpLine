import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateFestivalMutation } from "@/api/festivals/useCreateFestival";
import { useUpdateFestivalMutation } from "@/api/festivals/useUpdateFestival";
import { Festival } from "@/api/festivals/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { generateSlug, isValidSlug, sanitizeSlug } from "@/lib/slug";
import { TimezonePicker } from "@/components/Admin/ScheduleImport/TimezonePicker";

const DEFAULT_FESTIVAL_TIMEZONE = "Europe/Lisbon";

const festivalFormSchema = z.object({
  name: z.string().trim().min(1, "Festival name is required"),
  slug: z
    .string()
    .min(1, "Festival slug is required")
    .refine(
      isValidSlug,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  description: z.string(),
  published: z.boolean(),
  timezone: z.string(),
});

type FestivalFormData = z.infer<typeof festivalFormSchema>;

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

  const form = useForm<FestivalFormData>({
    resolver: zodResolver(festivalFormSchema),
    defaultValues: getDefaultValues(editingFestival),
  });
  const isSubmitting =
    createFestivalMutation.isPending || updateFestivalMutation.isPending;

  const { reset } = form;
  useEffect(() => {
    if (open) {
      reset(getDefaultValues(editingFestival));
    }
  }, [open, editingFestival, reset]);

  function handleNameChange(name: string) {
    // The slug follows the name until it's edited directly, i.e. while it
    // still equals the slug derived from the previous name.
    const { name: prevName, slug } = form.getValues();
    if (slug === "" || slug === generateSlug(prevName)) {
      form.setValue("slug", generateSlug(name), { shouldValidate: true });
    }
  }

  function handleSubmit(values: FestivalFormData) {
    const festivalData = { ...values, name: values.name.trim() };
    if (editingFestival) {
      updateFestivalMutation.mutate(
        { festivalId: editingFestival.id, festivalData },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createFestivalMutation.mutate(festivalData, {
        onSuccess: () => onOpenChange(false),
      });
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
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Festival Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Boom Festival"
                      {...field}
                      onChange={(e) => {
                        // Must run before field.onChange: it compares against the previous name.
                        handleNameChange(e.target.value);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., boom-festival"
                      {...field}
                      onChange={(e) =>
                        field.onChange(sanitizeSlug(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    This will be used in the URL: /festivals/
                    {field.value || "your-slug"}
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Short description for festival listings..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <TimezonePicker
                  value={field.value}
                  onChange={field.onChange}
                  description="All schedule times for this festival are displayed in this timezone."
                />
              )}
            />
            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Published</FormLabel>
                  <FormDescription className="!mt-0">
                    {field.value
                      ? "Visible to public users"
                      : "Only visible to admins"}
                  </FormDescription>
                </FormItem>
              )}
            />
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function getDefaultValues(festival: Festival | null): FestivalFormData {
  if (!festival) {
    return {
      name: "",
      slug: "",
      description: "",
      published: false,
      timezone: DEFAULT_FESTIVAL_TIMEZONE,
    };
  }
  return {
    name: festival.name,
    slug: festival.slug || generateSlug(festival.name),
    description: festival.description || "",
    published: festival.published || false,
    timezone: festival.timezone || DEFAULT_FESTIVAL_TIMEZONE,
  };
}

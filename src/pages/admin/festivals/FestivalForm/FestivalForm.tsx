import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { TimezonePicker } from "@/components/Admin/ScheduleImport/TimezonePicker";
import { FestivalNameField } from "./FestivalNameField";
import { FestivalSlugField } from "./FestivalSlugField";
import { FestivalPublishedField } from "./FestivalPublishedField";
import { festivalFormSchema, FestivalFormData } from "./festivalFormSchema";

interface FestivalFormProps {
  defaultValues: FestivalFormData;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: FestivalFormData) => void;
  onCancel: () => void;
}

export function FestivalForm({
  defaultValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: FestivalFormProps) {
  const form = useForm<FestivalFormData>({
    resolver: zodResolver(festivalFormSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <FestivalNameField />
        <FestivalSlugField />
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
        <FestivalPublishedField />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}

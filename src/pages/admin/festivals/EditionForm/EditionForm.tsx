import { useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { generateSlug, sanitizeSlug } from "@/lib/slug";
import { ScheduleRevealLevelField } from "../ScheduleRevealLevelField";
import { editionFormSchema, EditionFormData } from "./editionFormSchema";

interface EditionFormProps {
  defaultValues: EditionFormData;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: EditionFormData) => void;
  onCancel: () => void;
}

export function EditionForm({
  defaultValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: EditionFormProps) {
  const form = useForm<EditionFormData>({
    resolver: zodResolver(editionFormSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <NameField />
        <SlugField />
        <YearField />
        <DateField name="start_date" label="Start Date" />
        <DateField name="end_date" label="End Date" />
        <PublishedField />
        <RevealLevelField />
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

function NameField() {
  const form = useFormContext<EditionFormData>();

  function followNameWithSlug(name: string) {
    // The slug follows the name until it's edited directly, i.e. while it
    // still equals the slug derived from the previous name.
    const { name: prevName, slug } = form.getValues();
    if (slug === "" || slug === generateSlug(prevName)) {
      form.setValue("slug", generateSlug(name), { shouldValidate: true });
    }
  }

  return (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Edition Name</FormLabel>
          <FormControl>
            <Input
              placeholder="e.g., Boom Festival 2025"
              {...field}
              onChange={(e) => {
                // Must run before field.onChange: it compares against the previous name.
                followNameWithSlug(e.target.value);
                field.onChange(e);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SlugField() {
  const form = useFormContext<EditionFormData>();

  return (
    <FormField
      control={form.control}
      name="slug"
      render={({ field }) => (
        <FormItem>
          <FormLabel>URL Slug</FormLabel>
          <FormControl>
            <Input
              placeholder="e.g., boom-2025"
              {...field}
              onChange={(e) => field.onChange(sanitizeSlug(e.target.value))}
            />
          </FormControl>
          <FormMessage />
          <FormDescription>
            This will be used in the URL: /festivals/festival-name/editions/
            {field.value || "your-slug"}
          </FormDescription>
        </FormItem>
      )}
    />
  );
}

function YearField() {
  const form = useFormContext<EditionFormData>();

  return (
    <FormField
      control={form.control}
      name="year"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Year</FormLabel>
          <FormControl>
            <Input
              type="number"
              min="2000"
              max="2100"
              {...field}
              value={Number.isNaN(field.value) ? "" : field.value}
              onChange={(e) => field.onChange(e.target.valueAsNumber)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function DateField({
  name,
  label,
}: {
  name: keyof Pick<EditionFormData, "start_date" | "end_date">;
  label: string;
}) {
  const form = useFormContext<EditionFormData>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type="date" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function PublishedField() {
  const form = useFormContext<EditionFormData>();

  return (
    <FormField
      control={form.control}
      name="published"
      render={({ field }) => (
        <FormItem className="flex items-center space-x-2 space-y-0">
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <FormLabel>Published</FormLabel>
          <FormDescription className="!mt-0">
            {field.value ? "Visible to public users" : "Only visible to admins"}
          </FormDescription>
        </FormItem>
      )}
    />
  );
}

function RevealLevelField() {
  const form = useFormContext<EditionFormData>();
  const published = form.watch("published");

  return (
    <FormField
      control={form.control}
      name="schedule_reveal_level"
      render={({ field }) => (
        <ScheduleRevealLevelField
          value={field.value}
          onChange={field.onChange}
          editionPublished={published}
        />
      )}
    />
  );
}

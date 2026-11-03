import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { EditionNameField } from "./EditionNameField";
import { EditionSlugField } from "./EditionSlugField";
import { EditionYearField } from "./EditionYearField";
import { EditionDateField } from "./EditionDateField";
import { EditionPublishedField } from "./EditionPublishedField";
import { EditionRevealLevelField } from "./EditionRevealLevelField";
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
        <EditionNameField />
        <EditionSlugField />
        <EditionYearField />
        <EditionDateField name="start_date" label="Start Date" />
        <EditionDateField name="end_date" label="End Date" />
        <EditionPublishedField />
        <EditionRevealLevelField />
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

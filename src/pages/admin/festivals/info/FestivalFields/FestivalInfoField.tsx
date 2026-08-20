import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { EditableField } from "./shared/EditableField";
import { EditContainer } from "./shared/EditContainer";
import { useFestivalInfoMutation } from "@/api/festival-info/useFestivalInfoMutation";
import { parseMarkdown } from "@/lib/markdown";
import { getTextAlignmentClasses } from "@/lib/textAlignment";

interface FestivalInfoFieldProps {
  festivalId: string;
  infoText?: string | null | undefined;
}

interface InfoFormData {
  infoText: string;
}

export function FestivalInfoField({
  festivalId,
  infoText,
}: FestivalInfoFieldProps) {
  return (
    <EditableField
      title="Information"
      renderEdit={({ onCancel, onSave }) => (
        <InfoFieldForm
          infoText={infoText}
          festivalId={festivalId}
          onCancel={onCancel}
          onSave={onSave}
        />
      )}
    >
      {infoText ? (
        <div
          className={`prose prose-sm max-w-none ${getTextAlignmentClasses(infoText)}`}
          dangerouslySetInnerHTML={{ __html: parseMarkdown(infoText) }}
        />
      ) : (
        <p className="text-muted-foreground italic">No description</p>
      )}
    </EditableField>
  );
}

function InfoFieldForm({
  infoText,
  festivalId,
  onCancel,
  onSave,
}: {
  festivalId: string;
  infoText?: string | null | undefined;
  onCancel: () => void;
  onSave: () => void;
}) {
  const mutation = useFestivalInfoMutation(festivalId);

  const form = useForm<InfoFormData>({
    defaultValues: {
      infoText: infoText || "",
    },
  });

  const handleSubmit = form.handleSubmit(handleSave);

  return (
    <EditContainer
      onSave={handleSubmit}
      onCancel={onCancel}
      isLoading={mutation.isPending}
      helpText="Tip: Press Ctrl+Enter to save quickly"
    >
      <Textarea
        {...form.register("infoText")}
        placeholder="Enter festival information (Markdown supported)"
        rows={8}
        onKeyDown={handleKeyDown}
      />
    </EditContainer>
  );

  function handleSave(data: InfoFormData) {
    mutation.mutate(
      { info_text: data.infoText || null },
      { onSuccess: onSave },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      onCancel();
    }
  }
}

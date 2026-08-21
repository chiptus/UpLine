import { Textarea } from "@/components/ui/textarea";
import type { CandidateUpdate } from "@/api/artistSearch/mergeCandidateSelection";

interface StagedFieldsPreviewProps {
  stagedUpdates: CandidateUpdate;
  onDescriptionChange: (description: string) => void;
}

export function StagedFieldsPreview({
  stagedUpdates,
  onDescriptionChange,
}: StagedFieldsPreviewProps) {
  if (!stagedUpdates.image_url && stagedUpdates.description === undefined) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 text-sm">
      {stagedUpdates.image_url && (
        <img
          src={stagedUpdates.image_url}
          alt=""
          className="h-12 w-12 rounded object-cover"
        />
      )}
      <div className="flex-1 space-y-1">
        <p className="font-medium">Also staged from candidate</p>
        {stagedUpdates.image_url && (
          <p className="text-muted-foreground">Image</p>
        )}
        {stagedUpdates.description !== undefined && (
          <Textarea
            value={stagedUpdates.description ?? ""}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={2}
            className="text-sm"
          />
        )}
      </div>
    </div>
  );
}

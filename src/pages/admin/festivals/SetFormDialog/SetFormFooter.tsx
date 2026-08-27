import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SetFormFooterProps {
  isEditing: boolean;
  disabled: boolean;
  isPending: boolean;
  onCancel: () => void;
}

export function SetFormFooter({
  isEditing,
  disabled,
  isPending,
  onCancel,
}: SetFormFooterProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={disabled}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={disabled}>
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {isEditing ? "Update" : "Create"}
      </Button>
    </div>
  );
}

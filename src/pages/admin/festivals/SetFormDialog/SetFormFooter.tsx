import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SetFormFooterProps {
  submitLabel: string;
  disabled: boolean;
  /** Extra reason to block submit that must not block Cancel. */
  submitDisabled?: boolean;
  isPending: boolean;
  onCancel: () => void;
}

export function SetFormFooter({
  submitLabel,
  disabled,
  submitDisabled = false,
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
      <Button type="submit" disabled={disabled || submitDisabled}>
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  );
}

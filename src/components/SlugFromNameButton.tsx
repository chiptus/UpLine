import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SlugFromNameButtonProps {
  disabled?: boolean;
  onClick: () => void;
}

export function SlugFromNameButton({
  disabled,
  onClick,
}: SlugFromNameButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-8 w-8 shrink-0"
      aria-label="Regenerate slug from name"
      title="Regenerate slug from name"
      disabled={disabled}
      onClick={onClick}
    >
      <Wand2 />
    </Button>
  );
}

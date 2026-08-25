import { Badge } from "@/components/ui/badge";
import { FlaskConical } from "lucide-react";

export function EnvironmentBadge() {
  if (import.meta.env.MODE !== "staging") return null;

  return (
    <Badge
      variant="secondary"
      className="fixed top-4 left-4 z-50 gap-1 border-amber-500 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
    >
      <FlaskConical size={12} />
      Testing environment - changes don't count
    </Badge>
  );
}

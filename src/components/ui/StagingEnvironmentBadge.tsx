import { Badge } from "@/components/ui/badge";
import { FlaskConical } from "lucide-react";

const PROD_SUPABASE_PROJECT_REF = "qssmazlqrmxiudxckxvi";

export function StagingEnvironmentBadge() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
  const isProd = supabaseUrl.includes(PROD_SUPABASE_PROJECT_REF);

  if (isProd) return null;

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

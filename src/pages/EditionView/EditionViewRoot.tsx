import { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The identity root for the voter-facing edition views: supplies the
// bg-app-gradient ground (the role-token CSS variables themselves live on
// :root per docs/design/edition-color-vocabulary.md, not on this class), and
// the flip (#359) attaches data-edition-theme="light" to this same node per
// docs/design/edition-identity-spec.md.
export function EditionViewRoot({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("edition-view min-h-screen bg-app-gradient", className)}>
      {children}
    </div>
  );
}

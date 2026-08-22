import { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The identity scope for the voter-facing edition views: `edition-view`
// anchors the CSS variables defined in src/index.css, and the flip (#359)
// attaches data-edition-theme="light" to this same node per
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

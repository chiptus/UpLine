import { Loader2 } from "lucide-react";

export function RouteLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen flex items-center justify-center"
    >
      <Loader2 className="h-8 w-8 animate-spin text-white" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

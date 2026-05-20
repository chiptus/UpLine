import { Loader2 } from "lucide-react";

export function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-app-gradient flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-white" />
    </div>
  );
}

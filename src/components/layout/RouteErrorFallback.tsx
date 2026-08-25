import { ErrorComponentProps, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function RouteErrorFallback({ error }: ErrorComponentProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center text-foreground">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="mb-6 text-muted-foreground">
          {error.message || "An unexpected error occurred"}
        </p>
        <Button onClick={() => router.invalidate()}>Try Again</Button>
      </div>
    </div>
  );
}

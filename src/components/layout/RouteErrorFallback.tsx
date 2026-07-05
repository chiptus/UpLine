import { ErrorComponentProps, useRouter } from "@tanstack/react-router";

export function RouteErrorFallback({ error }: ErrorComponentProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-app-gradient flex items-center justify-center p-4">
      <div className="text-center text-white">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="mb-6 text-purple-200">
          {error.message || "An unexpected error occurred"}
        </p>
        <button
          onClick={() => router.invalidate()}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

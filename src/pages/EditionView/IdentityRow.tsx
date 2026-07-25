import { Music } from "lucide-react";
import { useFestivalPhase } from "@/hooks/useFestivalPhase";

interface IdentityRowProps {
  title: string;
  logoUrl?: string | null;
}

// Non-live phases intentionally render nothing in the status slot —
// per-phase copy is a deferred design decision (#229).
export function IdentityRow({ title, logoUrl }: IdentityRowProps) {
  return (
    <div className="mb-3 md:mb-4 flex items-center gap-2">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${title} logo`}
          className="h-8 w-8 shrink-0 rounded object-contain"
        />
      ) : (
        <Music className="h-5 w-5 shrink-0 text-purple-400" />
      )}
      <h1 className="min-w-0 truncate text-lg md:text-xl font-bold text-white">
        {title}
      </h1>
      <LiveIndicator />
    </div>
  );
}

function LiveIndicator() {
  const { phase } = useFestivalPhase();
  if (phase !== "live") return null;

  return (
    <span
      role="status"
      className="ml-auto flex shrink-0 items-center gap-1.5 text-sm text-red-200"
      aria-label="Festival is live now"
    >
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 rounded-full bg-red-500 animate-pulse"
      />
      Live
    </span>
  );
}

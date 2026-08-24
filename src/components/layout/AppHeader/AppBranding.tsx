import { Link } from "@tanstack/react-router";
import { Music } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AppBrandingProps {
  isMobile: boolean;
}

export function AppBranding({ isMobile }: AppBrandingProps) {
  const { user, profile } = useAuth();

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

  const displayName =
    profile?.username || user?.email?.split("@")[0] || "there";

  return (
    <div className="flex items-center gap-4 flex-1">
      <Link to="/">
        <div className="flex items-center gap-3">
          <Music className="h-6 w-6 text-purple-400" />
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            UpLine
          </h1>
        </div>
      </Link>

      {/* User Greeting - Desktop Only */}
      {user && !isMobile && (
        <div className="flex items-center gap-3 pl-4 border-l border-purple-400/20">
          <span className="text-purple-200 text-sm">
            {getGreeting()}, {displayName}! 🎶
          </span>
        </div>
      )}
    </div>
  );
}

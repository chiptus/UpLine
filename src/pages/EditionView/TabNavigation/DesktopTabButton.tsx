import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { TabButtonProps } from "./types";

export function DesktopTabButton({ config, basePath }: TabButtonProps) {
  return (
    <Link
      key={config.key}
      to={`${basePath}/${config.key}`}
      activeProps={{
        className: cn(
          `flex items-center justify-center gap-2
          px-6 py-3 rounded-lg
          transition-all duration-200 active:scale-95
          bg-purple-600 text-white shadow-lg`,
        ),
      }}
      inactiveProps={{
        className: cn(
          `flex items-center justify-center gap-2
          px-6 py-3 rounded-lg
          transition-all duration-200 active:scale-95
          text-purple-200 hover:text-white hover:bg-white/10`,
        ),
      }}
    >
      <config.icon className="h-5 w-5" />
      <span className="font-medium">{config.label}</span>
    </Link>
  );
}

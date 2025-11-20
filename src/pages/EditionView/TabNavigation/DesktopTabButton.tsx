import { cn } from "@/lib/utils";
import { NavLink } from "@tanstack/react-router";
import { TabButtonProps } from "./types";

export function DesktopTabButton({ config, basePath }: TabButtonProps) {
  return (
    <NavLink
      key={config.key}
      to={`${basePath}/${config.key}`}
      className={({ isActive }) =>
        cn(
          `
          flex items-center justify-center gap-2
          px-6 py-3 rounded-lg
          transition-all duration-200 active:scale-95`,
          isActive
            ? "bg-purple-600 text-white shadow-lg"
            : "text-purple-200 hover:text-white hover:bg-white/10",
        )
      }
    >
      <config.icon className="h-5 w-5" />
      <span className="font-medium">{config.label}</span>
    </NavLink>
  );
}

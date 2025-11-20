import { Link } from "@tanstack/react-router";
import { TabButtonProps } from "./types";

export function MobileTabButton({ config, basePath }: TabButtonProps) {
  return (
    <Link
      key={config.key}
      to={`${basePath}/${config.key}` as any}
      activeProps={{
        className: `flex-1 flex flex-col items-center justify-center
          py-2 px-1 transition-colors duration-200 min-h-16 text-purple-400`,
      }}
      inactiveProps={{
        className: `flex-1 flex flex-col items-center justify-center
          py-2 px-1 transition-colors duration-200 min-h-16 text-gray-400 active:text-purple-300`,
      }}
    >
      {({ isActive }) => (
        <>
          <config.icon
            className={`h-6 w-6 mb-1 ${isActive ? "text-purple-400" : "text-gray-400"}`}
          />
          <span
            className={`text-xs font-medium text-center leading-tight ${isActive ? "text-purple-400" : "text-gray-400"}`}
          >
            {config.shortLabel}
          </span>
        </>
      )}
    </Link>
  );
}

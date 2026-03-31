import { Link, useParams } from "@tanstack/react-router";
import { TabButtonProps } from "./types";

const tabRoutes = {
  sets: "/festivals/$festivalSlug/editions/$editionSlug/sets",
  schedule: "/festivals/$festivalSlug/editions/$editionSlug/schedule",
  map: "/festivals/$festivalSlug/editions/$editionSlug/map",
  info: "/festivals/$festivalSlug/editions/$editionSlug/info",
  social: "/festivals/$festivalSlug/editions/$editionSlug/social",
  explore: "/festivals/$festivalSlug/editions/$editionSlug/explore",
} as const;

export function MobileTabButton({ config }: TabButtonProps) {
  const { festivalSlug, editionSlug } = useParams({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });

  return (
    <Link
      key={config.key}
      to={tabRoutes[config.key]}
      params={{ festivalSlug, editionSlug }}
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

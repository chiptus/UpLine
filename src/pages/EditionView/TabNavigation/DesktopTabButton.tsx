import { cn } from "@/lib/utils";
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

export function DesktopTabButton({ config }: TabButtonProps) {
  const { festivalSlug, editionSlug } = useParams({ strict: false });

  return (
    <Link
      key={config.key}
      to={tabRoutes[config.key]}
      params={{ festivalSlug: festivalSlug as string, editionSlug: editionSlug as string }}
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

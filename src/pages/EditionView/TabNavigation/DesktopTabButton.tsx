import { cn } from "@/lib/utils";
import { Link, useParams } from "@tanstack/react-router";
import { TabButtonProps } from "./types";
import { tabRoutes } from "./tabRoutes";

export function DesktopTabButton({ config }: TabButtonProps) {
  const { festivalSlug, editionSlug } = useParams({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });

  return (
    <Link
      key={config.key}
      to={tabRoutes[config.key]}
      params={{ festivalSlug, editionSlug }}
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
      <span className="relative inline-flex">
        <config.icon className="h-5 w-5" />
        {config.Indicator && <config.Indicator />}
      </span>
      <span className="font-medium">{config.label}</span>
    </Link>
  );
}

import { cn } from "@/lib/utils";
import { Link, useParams, useMatchRoute } from "@tanstack/react-router";
import { TabButtonProps } from "./types";
import { tabRoutes } from "./tabRoutes";

export function MobileTabButton({ config }: TabButtonProps) {
  const { festivalSlug, editionSlug } = useParams({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });
  const matchRoute = useMatchRoute();
  const isActive = !!matchRoute({ to: tabRoutes[config.key], fuzzy: true });

  return (
    <Link
      key={config.key}
      to={tabRoutes[config.key]}
      params={{ festivalSlug, editionSlug }}
      className={cn(
        "flex-1 flex flex-col items-center justify-center",
        "py-2 px-1 transition-colors duration-200 min-h-16",
        isActive
          ? "text-accent"
          : "text-subtle-foreground active:text-subtle-foreground",
      )}
    >
      <span className="relative inline-flex mb-1">
        <config.icon
          className={cn(
            "h-6 w-6",
            isActive ? "text-accent" : "text-subtle-foreground",
          )}
        />
        {config.Indicator && <config.Indicator />}
      </span>
      <span
        className={cn(
          "text-xs font-medium text-center leading-tight",
          isActive ? "text-accent" : "text-subtle-foreground",
        )}
      >
        {config.shortLabel}
      </span>
    </Link>
  );
}

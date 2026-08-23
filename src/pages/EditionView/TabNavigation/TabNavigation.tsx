import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { festivalInfoQuery } from "@/api/festival-info/useFestivalInfo";
import { customLinksQuery } from "@/api/custom-links/useCustomLinks";
import { useFestivalPhase } from "@/hooks/useFestivalPhase";
import { DesktopTabButton } from "./DesktopTabButton";
import { MobileTabButton } from "./MobileTabButton";
import { config } from "./config";
import { cn } from "@/lib/utils";
import { useHideOnScrollDown } from "@/hooks/useHideOnScrollDown";

const PRIMARY_TAB_LABEL = {
  "pre-schedule": "Lineup",
  planning: "Vote",
  live: "Vote",
  "post-festival": "Vote",
} as const;

export function MainTabNavigation() {
  const { festival } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });
  const { data: festivalInfo } = useSuspenseQuery(
    festivalInfoQuery(festival.id),
  );
  const { data: customLinks } = useSuspenseQuery(customLinksQuery(festival.id));
  const { phase } = useFestivalPhase();
  const hideBottomBar = useHideOnScrollDown();

  const visibleTabs = config
    .filter((config) => {
      if (typeof config.enabled === "boolean") {
        return config.enabled;
      }
      return config.enabled({ festivalInfo, customLinks });
    })
    .map((config) => {
      if (config.key !== "sets") return config;
      const label = PRIMARY_TAB_LABEL[phase];
      return { ...config, label, shortLabel: label };
    });

  return (
    <>
      {/* Desktop: Horizontal tabs at top */}
      <div className="hidden md:block mb-6">
        <div className="bg-surface-raised backdrop-blur-md rounded-lg p-2">
          <div className="flex gap-1 justify-center">
            {visibleTabs.map((config) => (
              <DesktopTabButton key={config.key} config={config} />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: Fixed bottom navigation */}
      <div
        data-testid="mobile-tab-bar"
        className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 z-50 bg-popover backdrop-blur-md border-t border-border safe-area-pb transition-transform duration-200",
          hideBottomBar && "translate-y-full",
        )}
      >
        <div className="flex">
          {visibleTabs.map((config) => (
            <MobileTabButton key={config.key} config={config} />
          ))}
        </div>
      </div>
    </>
  );
}

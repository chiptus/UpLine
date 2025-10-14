import { forwardRef, useCallback } from "react";
import { Music, Heart, TicketIcon, ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TitleSectionProps {
  title: string;
  logoUrl?: string | null;
  onLogoRefChange?: (ref: HTMLElement | null) => void;
  websiteUrl?: string;
  ticketsUrl?: string;
}

export const TitleSection = forwardRef<HTMLDivElement, TitleSectionProps>(
  ({ title, logoUrl, onLogoRefChange, ticketsUrl, websiteUrl }, ref) => {
    const hasLinks = !!(ticketsUrl || websiteUrl);

    const logoRefCallback = useCallback(
      (node: HTMLImageElement | null) => {
        onLogoRefChange?.(node);
      },
      [onLogoRefChange],
    );

    return (
      <div
        ref={ref}
        className="text-center space-y-2 md:space-y-4 mb-4 md:mb-8"
      >
        <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-6">
          {logoUrl ? (
            <img
              ref={logoRefCallback}
              src={logoUrl}
              alt={`${title} logo`}
              className="h-20 md:h-32 lg:h-40 w-auto max-w-sm object-contain rounded"
            />
          ) : (
            <>
              <Music className="h-6 md:h-8 w-6 md:w-8 text-purple-400 animate-pulse" />
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                {title}
              </h2>
              <Heart className="h-6 md:h-8 w-6 md:w-8 text-pink-400 animate-pulse" />
            </>
          )}
        </div>

        {hasLinks && (
          <div className="flex gap-3 justify-center">
            {ticketsUrl && (
              <Button
                size="sm"
                asChild
                className="gap-2 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:border-white/30 text-white font-semibold transition-all"
              >
                <a href={ticketsUrl} target="_blank" rel="noopener noreferrer">
                  <TicketIcon className="h-5 w-5" />
                  Tickets
                </a>
              </Button>
            )}
            {websiteUrl && (
              <Button
                size="sm"
                asChild
                className="gap-2 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:border-white/30 text-white font-semibold transition-all"
              >
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLinkIcon className="h-4 w-4" />
                  Website
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
    );
  },
);

TitleSection.displayName = "TitleSection";

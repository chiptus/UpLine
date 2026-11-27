import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSocialPlatformLogo } from "./SocialPlatformUtils";

interface SocialPlatformLinkProps {
  url: string;
  artistName: string;
  size?: "sm" | "md";
}

export function SocialPlatformLink({
  url,
  artistName,
  size = "md",
}: SocialPlatformLinkProps) {
  const platformInfo = getSocialPlatformLogo(url);

  if (!platformInfo) {
    return null;
  }

  const buttonSize = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const imageSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <Button
      asChild
      variant="secondary"
      size="sm"
      className={`p-1 ${buttonSize} bg-surface-active hover:bg-foreground/30 backdrop-blur-sm border-0 ${platformInfo.color}`}
      title={`Open ${artistName} in ${platformInfo.platform}`}
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        {platformInfo.tint ? (
          <span
            role="img"
            aria-label={`${platformInfo.platform} logo`}
            data-testid="tinted-platform-logo"
            className={cn(imageSize, "block")}
            style={{
              backgroundColor: platformInfo.tint,
              maskImage: `url(${platformInfo.logo})`,
              WebkitMaskImage: `url(${platformInfo.logo})`,
              maskSize: "contain",
              WebkitMaskSize: "contain",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskPosition: "center",
            }}
          />
        ) : (
          <img
            src={platformInfo.logo}
            alt={`${platformInfo.platform} logo`}
            className={cn(imageSize, "object-contain")}
          />
        )}
      </a>
    </Button>
  );
}

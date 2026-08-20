import { MapPin } from "lucide-react";

interface StageBadgeProps {
  stageName: string;
  stageColor?: string | undefined;
  size?: "sm" | "md" | undefined;
  showIcon?: boolean | undefined;
}

export function StageBadge({
  stageName,
  stageColor,
  size = "sm",
  showIcon = true,
}: StageBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-1 gap-1",
    md: "text-sm px-3 py-1.5 gap-2",
  };

  const iconSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
  };

  return (
    <div
      className={`inline-flex items-center rounded-full backdrop-blur-sm border text-white font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: stageColor ? `${stageColor}80` : "#7c3aed80",
        borderColor: stageColor ? stageColor : "#7c3aed",
      }}
    >
      {showIcon && <MapPin className={iconSize[size]} />}
      <span>{stageName}</span>
    </div>
  );
}

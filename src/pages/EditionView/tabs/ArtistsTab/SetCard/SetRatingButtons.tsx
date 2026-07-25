import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  RATING_CONFIG,
  RATING_TYPES,
  type RatingConfig,
} from "@/lib/ratingConfig";
import { useFestivalSet } from "../FestivalSetContext";
import { useUserRatings } from "@/api/ratings/useUserRatings";
import { useRateSet } from "@/api/ratings/useRateSet";
import { useAuth } from "@/contexts/AuthContext";

interface SetRatingButtonsProps {
  size?: "sm" | "default";
  layout?: "horizontal" | "vertical";
}

export function SetRatingButtons({
  size = "default",
  layout = "vertical",
}: SetRatingButtonsProps) {
  const { user, showAuthDialog } = useAuth();

  const { set } = useFestivalSet();
  const userRatingsQuery = useUserRatings(user?.id);
  const rateMutation = useRateSet();

  const userRatingForSet = userRatingsQuery.data?.[set.id];

  const containerClass =
    layout === "horizontal" ? "flex items-center gap-2" : "space-y-3";

  return (
    <div className={containerClass}>
      {userRatingsQuery.isLoading && (
        <div
          className={`h-4 w-4 animate-spin rounded-full border-2 border-t-transparent`}
        />
      )}
      {RATING_TYPES.map((ratingType) => {
        const config = RATING_CONFIG[ratingType];
        return (
          <RatingButton
            key={ratingType}
            config={config}
            isSelected={userRatingForSet === config.value}
            onClick={() => handleRate(config.value)}
            isRating={rateMutation.isPending}
            size={size}
            layout={layout}
          />
        );
      })}
    </div>
  );

  function handleRate(rating: number) {
    if (!user?.id) {
      showAuthDialog();

      return;
    }

    rateMutation.mutate({
      setId: set.id,
      rating,
      userId: user?.id,
      existingRating: userRatingForSet,
    });
  }
}

function RatingButton({
  config,
  layout,
  isSelected,
  size,
  onClick,
  isRating,
}: {
  isSelected: boolean;
  config: RatingConfig;
  size?: "sm" | "default";
  layout?: "horizontal" | "vertical";
  onClick(): void;
  isRating: boolean;
}) {
  const buttonClass = layout === "horizontal" ? "" : "flex-1";
  const IconComponent = config.icon;

  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      size={size}
      onClick={() => onClick()}
      disabled={isRating}
      aria-pressed={isSelected}
      aria-label={config.label}
      className={cn(
        buttonClass,
        isSelected ? config.buttonSelected : config.buttonUnselected,
      )}
      title={config.label}
    >
      <IconComponent className="h-4 w-4 mr-2" />
      {config.label}
    </Button>
  );
}

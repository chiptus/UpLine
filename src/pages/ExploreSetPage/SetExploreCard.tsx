import { FestivalSet } from "@/api/sets/types";
import { Card } from "@/components/ui/card";
import { motion, PanInfo } from "framer-motion";
import { useState } from "react";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import { SetCardHeader } from "./SetExploreCard/SetCardHeader";
import { PrimaryArtistDisplay } from "./SetExploreCard/PrimaryArtistDisplay";
import { SupportingArtists } from "./SetExploreCard/SupportingArtists";
import { SetAudioPlayer } from "./SetExploreCard/SetAudioPlayer";

interface SetExploreCardProps {
  set: FestivalSet;
  isFront?: boolean;
  onSwipe?: (direction: "left" | "right") => void;
  onTap?: () => void;
  onDragUpdate?: (
    direction: "left" | "right" | null,
    intensity: number,
  ) => void;
}

export function SetExploreCard({
  set,
  isFront,
  onSwipe,
  onTap,
  onDragUpdate,
}: SetExploreCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const use24Hour = useTimeFormat();

  // Get primary artist (first artist) for main display
  const primaryArtist = set.artists[0];
  const supportingArtists = set.artists.slice(1);

  return (
    <motion.div
      className="h-full w-full cursor-grab active:cursor-grabbing"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onClick={onTap}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full w-full overflow-hidden bg-popover text-popover-foreground border-border shadow-2xl">
        {/* Background Image */}
        <div className="relative h-full">
          {primaryArtist?.image_url && (
            <>
              <img
                src={primaryArtist.image_url}
                alt={primaryArtist.name}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  imageLoaded ? "opacity-30" : "opacity-0"
                }`}
                onLoad={() => setImageLoaded(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-popover via-popover/70 to-transparent" />
            </>
          )}

          {/* Content */}
          <div className="relative h-full flex flex-col justify-between p-6 text-foreground">
            {/* Header Info */}
            <SetCardHeader
              stageId={set.stage_id || undefined}
              timeStart={set.time_start}
              use24Hour={use24Hour}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center space-y-4">
              {/* Set Name */}
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">{set.name}</h2>
              </div>

              {/* Primary Artist */}
              {primaryArtist && (
                <PrimaryArtistDisplay
                  artist={primaryArtist}
                  onSoundCloudClick={(e) => e.stopPropagation()}
                />
              )}

              {/* Supporting Artists */}
              <SupportingArtists artists={supportingArtists} />
            </div>

            <div className="flex justify-center">
              <SetAudioPlayer
                soundcloudUrl={primaryArtist?.soundcloud_url || undefined}
                isActive={Boolean(isFront) && !isDragging}
              />
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-sm text-subtle-foreground">
                Swipe or tap buttons to vote
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  function handleDragEnd(
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) {
    // Reset drag feedback
    onDragUpdate?.(null, 0);
    setIsDragging(false);

    const swipeThreshold = 100;
    const velocityThreshold = 500;

    if (
      Math.abs(info.offset.x) > swipeThreshold ||
      Math.abs(info.velocity.x) > velocityThreshold
    ) {
      if (info.offset.x > 0) {
        onSwipe?.("right");
      } else {
        onSwipe?.("left");
      }
    }
  }

  function handleDrag(
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) {
    const dragDistance = Math.abs(info.offset.x);
    const maxDistance = 150; // Max distance for full intensity
    const intensity = Math.min(dragDistance / maxDistance, 1);

    if (dragDistance > 10) {
      // Minimum drag threshold
      const direction = info.offset.x > 0 ? "right" : "left";
      setIsDragging(true);
      onDragUpdate?.(direction, intensity);
    } else {
      setIsDragging(false);
      onDragUpdate?.(null, 0);
    }
  }
}

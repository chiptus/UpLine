import { useNavigate } from "@tanstack/react-router";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { LoadingState } from "./components/LoadingState";
import { EmptyState } from "./components/EmptyState";
import { ExplorePageHeader } from "./components/ExplorePageHeader";
import { CardStackContainer } from "./components/CardStackContainer";
import { VotingSection } from "./components/VotingSection";
import { useAuth } from "@/contexts/AuthContext";
import { useVote } from "@/api/voting/useVote";
import { useUserVotes } from "@/api/voting/useUserVotes";
import { useState } from "react";
import { useExplorableSets } from "./useExplorableSets";
import { PageTitle } from "@/components/PageTitle/PageTitle";

export function ExploreSetPage() {
  const { edition } = useFestivalEdition();
  const navigate = useNavigate();
  const { user, showAuthDialog } = useAuth();
  const voteMutation = useVote();
  const { data: userVotes = {} } = useUserVotes(user?.id || "");

  const explorableSetsQuery = useExplorableSets({
    editionId: edition?.id,
    userVotes,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [dragFeedback, setDragFeedback] = useState<{
    direction: "left" | "right" | null;
    intensity: number;
  }>({ direction: null, intensity: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [skippedCount, setSkippedCount] = useState(0);

  const explorableSets = explorableSetsQuery.data || [];
  const currentSet = explorableSets[currentIndex];
  const isLastSet = currentIndex >= explorableSets.length - 1;

  if (explorableSetsQuery.isLoading) {
    return <LoadingState />;
  }

  const totalExplorableSets = explorableSets.length;
  const nextSet = !isLastSet ? explorableSets[currentIndex + 1] : undefined;

  if (!edition || totalExplorableSets === 0) {
    return <EmptyState />;
  }
  const totalSets = explorableSetsQuery.totalSets;
  const currentIndexInAllSets =
    totalSets - totalExplorableSets + currentIndex + 1;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-purple-900 to-black">
      <PageTitle title={`Explore Sets - ${edition.name}`} />
      <ExplorePageHeader
        editionName={edition.name}
        currentIndex={currentIndexInAllSets}
        totalSets={totalSets}
        votedCount={explorableSetsQuery.votedCount}
        nonExplorableCount={explorableSetsQuery.nonExplorableCount}
        skippedCount={skippedCount}
      />

      {/* Card Stack */}
      <CardStackContainer
        currentSet={currentSet}
        nextSet={nextSet}
        direction={direction}
        onSwipe={handleSwipe}
        onDragUpdate={handleDragUpdate}
        isLastSet={isLastSet}
      />

      {/* Voting Actions */}
      <VotingSection
        currentSet={currentSet}
        onVote={handleVote}
        onSkip={handleSkip}
        dragFeedback={dragFeedback}
      />
    </div>
  );

  async function handleVote(voteType: number) {
    if (!currentSet || isAnimating) return;

    if (!user) {
      showAuthDialog();
      return;
    }

    const existingVote = userVotes[currentSet.id];

    setIsAnimating(true);

    try {
      await voteMutation.mutateAsync({
        setId: currentSet.id,
        voteType,
        userId: user.id,
        existingVote,
      });

      setDirection(voteType >= 1 ? "right" : "left");

      setTimeout(() => {
        if (isLastSet) {
          navigate({
            from: "/festivals/$festivalSlug/editions/$editionSlug/explore",
            to: "../sets",
          });
        } else {
          setDirection(null);
        }
        setIsAnimating(false);
      }, 300);
    } catch (error) {
      console.error("Failed to vote:", error);
      setIsAnimating(false);
    }
  }

  function handleSwipe(direction: "left" | "right") {
    if (direction === "left") {
      handleVote(-1); // Won't Go
    } else {
      handleVote(1); // Interested
    }
  }

  function handleDragUpdate(
    direction: "left" | "right" | null,
    intensity: number,
  ) {
    setDragFeedback({ direction, intensity });
  }

  function handleSkip() {
    if (isAnimating) return;

    setIsAnimating(true);
    setDirection("left");
    setSkippedCount((prev) => prev + 1);
    setTimeout(() => {
      if (isLastSet) {
        navigate({
          from: "/festivals/$festivalSlug/editions/$editionSlug/explore",
          to: "../sets",
        });
      } else {
        setCurrentIndex((prev) => prev + 1);
        setDirection(null);
      }
      setIsAnimating(false);
    }, 300);
  }
}

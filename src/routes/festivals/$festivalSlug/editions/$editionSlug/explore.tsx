import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoadingState } from "@/pages/ExploreSetPage/components/LoadingState";
import { EmptyState } from "@/pages/ExploreSetPage/components/EmptyState";
import { ExplorePageHeader } from "@/pages/ExploreSetPage/components/ExplorePageHeader";
import { CardStackContainer } from "@/pages/ExploreSetPage/components/CardStackContainer";
import { VotingSection } from "@/pages/ExploreSetPage/components/VotingSection";
import { useAuth } from "@/contexts/AuthContext";
import { useVoteMutation } from "@/api/voting/useVoteMutation";
import { useUserVotesQuery } from "@/api/voting/useUserVotesQuery";
import { useState } from "react";
import { useExplorableSets } from "@/pages/ExploreSetPage/useExplorableSets";
import { pageMeta } from "@/lib/pageHead";
import { VOTE_CONFIG } from "@/lib/voteConfig";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/explore",
)({
  component: ExploreSetPage,
  head: ({ match }) =>
    match.context.edition
      ? {
          meta: pageMeta({
            title: `Explore Sets - ${match.context.edition.name}`,
          }),
        }
      : {},
});

function ExploreSetPage() {
  const { edition } = Route.useRouteContext();
  const navigate = useNavigate();
  const { user, showAuthDialog } = useAuth();
  const voteMutation = useVoteMutation();
  const userVotesQuery = useUserVotesQuery(user?.id);
  const userVotes = userVotesQuery.data ?? {};
  const votesReady =
    !user || userVotesQuery.isSuccess || userVotesQuery.isError;

  const explorableSetsQuery = useExplorableSets({
    editionId: edition?.id,
    userVotes,
    votesReady,
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
  const currentVote = currentSet ? userVotes[currentSet.id] : undefined;

  return (
    <div className="relative min-h-screen">
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
        currentVote={currentVote}
      />
    </div>
  );

  function handleVote(voteType: number) {
    if (!currentSet || isAnimating) return;

    if (!user) {
      showAuthDialog();
      return;
    }

    const existingVote = userVotes[currentSet.id];
    // Only "Won't Go" advances to the next artist, matching the explicit
    // skip action. "Must Go" / "Interested" just cast the vote and stay.
    const isWontGo = voteType === VOTE_CONFIG.wontGo.value;

    if (isWontGo) {
      setIsAnimating(true);
    }

    voteMutation.mutate(
      {
        setId: currentSet.id,
        voteType,
        userId: user.id,
        existingVote,
      },
      {
        onSuccess: () => {
          if (!isWontGo) return;

          setDirection("left");

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
        },
        onError: (error) => {
          console.error("Failed to vote:", error);
          if (isWontGo) setIsAnimating(false);
        },
      },
    );
  }

  function handleSwipe(direction: "left" | "right") {
    if (direction === "left") {
      handleVote(VOTE_CONFIG.wontGo.value);
    } else {
      handleVote(VOTE_CONFIG.interested.value);
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

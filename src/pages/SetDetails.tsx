import { useParams, useRouteContext } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArtistImageCard } from "./SetDetails/SetImageCard";
import { MixedArtistImage } from "./SetDetails/MixedArtistImage";
import { SetInfoCard } from "./SetDetails/SetInfoCard";
import { MultiArtistSetInfoCard } from "./SetDetails/MultiArtistSetInfoCard";
import { SetGroupVoting } from "./SetDetails/SetGroupVoting";
import { SetNotes } from "./SetDetails/SetNotes";
import { useUrlState } from "@/hooks/useUrlState";
import { setBySlugQuery } from "@/api/sets/useSetBySlug";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useVoteCount } from "@/hooks/useVoteCount";
import { PageTitle } from "@/components/PageTitle/PageTitle";
import { TopBar } from "@/components/layout/TopBar";
import { FestivalIndicator } from "@/components/layout/AppHeader/FestivalIndicator";

export function SetDetails() {
  const { user } = useAuth();
  const { setSlug } = useParams({
    from: "/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug",
  });
  const { festival } = useFestivalEdition();
  const { edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });
  const { state: urlState } = useUrlState();
  const { data: currentSet } = useSuspenseQuery(
    setBySlugQuery(setSlug, edition.id),
  );

  const { getVoteCount } = useVoteCount(currentSet);

  const setTitle = currentSet.name;

  const netVoteScore = 2 * getVoteCount(2) + getVoteCount(1) - getVoteCount(-1);

  const isMultiArtistSet = currentSet.artists.length > 1;
  const primaryArtist = currentSet.artists[0];

  return (
    <>
      <PageTitle title={setTitle} prefix={festival?.name} />
      <div className="min-h-screen bg-app-gradient">
        <div className="container mx-auto px-4 py-8">
          <TopBar showBackButton backLabel="Back to Artists" showGroupsButton>
            <FestivalIndicator
              title={festival?.name}
              logoUrl={festival?.logo_url}
            />
          </TopBar>

          {/* Set Header */}
          {isMultiArtistSet ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Mixed Image for Multi-Artist Sets */}
              <MixedArtistImage
                artists={currentSet.artists}
                setName={currentSet.name}
                className="aspect-square rounded-lg"
              />

              <MultiArtistSetInfoCard
                set={currentSet}
                netVoteScore={netVoteScore}
                use24Hour={urlState.use24Hour}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <ArtistImageCard
                imageUrl={primaryArtist.image_url}
                artistName={currentSet.name}
              />

              <SetInfoCard
                set={currentSet}
                netVoteScore={netVoteScore}
                use24Hour={urlState.use24Hour}
              />
            </div>
          )}

          {/* Set Group Voting Section */}
          <div className="mb-8">
            <SetGroupVoting setId={currentSet.id} />
          </div>

          {/* Set Notes Section */}
          <div className="mb-8">
            <SetNotes setId={currentSet.id} userId={user?.id || null} />
          </div>
        </div>
      </div>
    </>
  );
}

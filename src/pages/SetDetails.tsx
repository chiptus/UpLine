import { useParams } from "@tanstack/react-router";
import { ArtistImageCard } from "./SetDetails/SetImageCard";
import { MixedArtistImage } from "./SetDetails/MixedArtistImage";
import { SetInfoCard } from "./SetDetails/SetInfoCard";
import { MultiArtistSetInfoCard } from "./SetDetails/MultiArtistSetInfoCard";
import { ArtistNotFoundState } from "./SetDetails/SetNotFoundState";
import { ArtistLoadingState } from "./SetDetails/SetLoadingState";
import { SetGroupVoting } from "./SetDetails/SetGroupVoting";
import { SetNotes } from "./SetDetails/SetNotes";
import { useUrlState } from "@/hooks/useUrlState";
import { useSetBySlugQuery } from "@/hooks/queries/sets/useSetBySlug";
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
  const { edition, festival } = useFestivalEdition();
  const { state: urlState } = useUrlState();
  const setQuery = useSetBySlugQuery({
    slug: setSlug,
    editionId: edition?.id,
  });

  const { getVoteCount } = useVoteCount(setQuery.data);

  const setTitle = setQuery.data?.name;

  const netVoteScore = 2 * getVoteCount(2) + getVoteCount(1) - getVoteCount(-1);

  if (setQuery.isLoading) {
    return <ArtistLoadingState />;
  }

  if (!setQuery.data) {
    return <ArtistNotFoundState />;
  }
  const currentSet = setQuery.data;
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

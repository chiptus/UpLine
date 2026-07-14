import { useEffect, useState, useMemo, useCallback } from "react";
import type { FilterSortState } from "@/hooks/useUrlState";
import { FestivalSet } from "@/api/sets/types";
import { useGroupMembersQuery } from "@/api/groups/useGroupMembers";
import { tallyVotes } from "@/lib/votes/score";

export function useSetFiltering(
  sets: FestivalSet[],
  filterSortState: FilterSortState,
) {
  const groupMembersQuery = useGroupMembersQuery(
    filterSortState?.groupId || "",
  );
  const groupMemberIds = useMemo(() => {
    if (!groupMembersQuery.data) return new Set<string>();
    return new Set(groupMembersQuery.data.map((member) => member.id));
  }, [groupMembersQuery.data]);

  const [lockedOrder, setLockedOrder] = useState<FestivalSet[]>([]);

  // Filter and sort sets based on current state
  const filteredAndSortedSets = useMemo(() => {
    if (!filterSortState) return sets;

    const filtered = sets
      .map((set) => {
        // Filter votes by group if groupId is selected
        let filteredVotes = set.votes || [];
        if (filterSortState.groupId && groupMemberIds.size > 0) {
          filteredVotes = filteredVotes.filter((vote) =>
            groupMemberIds.has(vote.user_id),
          );
        }

        return {
          ...set,
          votes: filteredVotes,
        };
      })
      .filter((set) => {
        // Filter out sets without artists for voting tab
        if (!set.artists || set.artists.length === 0) {
          return false;
        }

        // Stage filter - use set's stage_id directly
        if (filterSortState.stages.length > 0 && set.stage_id) {
          if (!filterSortState.stages.includes(set.stage_id)) return false;
        }

        // Genre filter - check all artists' genres
        if (
          filterSortState.genres.length > 0 &&
          set.artists &&
          set.artists.length > 0
        ) {
          const hasMatchingGenre = set.artists.some((artist) =>
            artist.artist_music_genres?.some((genre) =>
              filterSortState.genres.includes(genre.music_genre_id),
            ),
          );
          if (!hasMatchingGenre) return false;
        }

        return true;
      });

    filtered.sort((a, b) => {
      let primarySort = 0;

      switch (filterSortState.sort) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "score-desc":
          primarySort = tallyVotes(b.votes).score - tallyVotes(a.votes).score;
          break;
        case "date-asc":
          if (!a.time_start && !b.time_start) {
            primarySort = 0;
            break;
          }
          if (!a.time_start) return 1;
          if (!b.time_start) return -1;
          primarySort =
            new Date(a.time_start).getTime() - new Date(b.time_start).getTime();
          break;
        default:
          primarySort = 0;
      }

      // If primary sort values are equal, sort by soundcloud followers
      if (primarySort !== 0) {
        return primarySort;
      }

      const secondarySort = calculateFollowersSort(a, b);
      if (secondarySort !== 0) {
        return secondarySort;
      }

      // Tertiary sort alphabetically
      return a.name.localeCompare(b.name);
    });

    // If sort is locked, use the locked order but with updated vote data
    if (filterSortState.sortLocked && lockedOrder.length > 0) {
      // Update the locked order with fresh data while preserving positions
      const updatedLockedOrder = lockedOrder.map((lockedSet) => {
        const freshSet = filtered.find((f) => f.id === lockedSet.id);
        return freshSet || lockedSet;
      });
      // Add any new sets that weren't in the locked order
      const newSets = filtered.filter(
        (f) => !lockedOrder.some((l) => l.id === f.id),
      );
      return [...updatedLockedOrder, ...newSets];
    }

    return filtered;
  }, [sets, filterSortState, groupMemberIds, lockedOrder]);

  // Update locked order when sort is unlocked
  useEffect(() => {
    if (!filterSortState?.sortLocked) {
      setLockedOrder([]);
    }
  }, [filterSortState?.sortLocked]);

  // Function to lock the current order and update URL state
  const lockCurrentOrder = useCallback(
    (updateUrlState: (state: Partial<FilterSortState>) => void) => {
      setLockedOrder([...filteredAndSortedSets]);
      updateUrlState({ sortLocked: true });
    },
    [filteredAndSortedSets],
  );

  return {
    filteredAndSortedSets,
    lockCurrentOrder,
  };
}

// Get max soundcloud followers for a set
function getMaxSoundcloudFollowers(set: FestivalSet): number {
  return Math.max(
    ...set.artists.map((artist) => artist.soundcloud_followers || 0),
  );
}

function calculateFollowersSort(a: FestivalSet, b: FestivalSet) {
  // Secondary sort by soundcloud followers
  const aFollowers = getMaxSoundcloudFollowers(a);
  const bFollowers = getMaxSoundcloudFollowers(b);

  if (aFollowers === bFollowers) {
    return 0; // They are equal in followers
  }

  if (aFollowers && bFollowers) {
    return bFollowers - aFollowers;
  }

  if (aFollowers) {
    return -1; // a has followers, b does not
  }

  if (bFollowers) {
    return 1; // b has followers, a does not
  }

  return 0;
}

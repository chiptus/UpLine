// PROTOTYPE (timeline nav & filtering) — throwaway, delete with this folder.
//
// Real votes when logged in; deterministic fake votes when logged out so the
// my-vote chips are demoable anonymously. The real implementation hides the
// chips entirely when logged out.
import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserVotes } from "@/api/voting/useUserVotes";

function fakeVote(setId: string): number | undefined {
  let hash = 0;
  for (let i = 0; i < setId.length; i++) {
    hash = (hash * 31 + setId.charCodeAt(i)) >>> 0;
  }
  const bucket = hash % 10;
  if (bucket < 2) return 2;
  if (bucket < 5) return 1;
  if (bucket === 5) return -1;
  return undefined;
}

export function usePrototypeVotes() {
  const { user } = useAuth();
  const { data: userVotes } = useUserVotes(user?.id);
  const isFake = !user;

  const getVote = useCallback(
    (setId: string): number | undefined => {
      if (user) return userVotes?.[setId];
      return fakeVote(setId);
    },
    [user, userVotes],
  );

  return { getVote, isFake };
}

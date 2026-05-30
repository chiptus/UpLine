import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPermissionsQuery } from "@/hooks/queries/auth/useUserPermissions";
import {
  type MaskableSet,
  type RevealLevel,
  canShowDay,
  canShowStage,
  canShowTime,
  maskSetForReveal,
} from "@/lib/scheduleReveal";

export function useScheduleReveal() {
  const { edition } = useFestivalEdition();
  const { user } = useAuth();
  const { data: isAdmin = false } = useUserPermissionsQuery(
    user?.id,
    "is_admin",
  );

  const level: RevealLevel = edition?.schedule_reveal_level ?? "draft";

  return {
    level,
    isAdmin,
    canShowDay: canShowDay(level, isAdmin),
    canShowStage: canShowStage(level, isAdmin),
    canShowTime: canShowTime(level, isAdmin),
    maskSet<T extends MaskableSet>(set: T): T {
      return maskSetForReveal(set, level, isAdmin);
    },
  };
}

import { getFestivalDayKey } from "@/lib/timeUtils";

export interface DayGroupable {
  time: Date;
}

export interface DayGroup<T extends DayGroupable> {
  dayKey: string;
  slots: T[];
}

// Day boundaries are computed in the festival timezone (not the viewer's
// local one), so a post-midnight set groups under the correct calendar day.
export function groupTimeSlotsByFestivalDay<T extends DayGroupable>(
  timeSlots: T[],
  timezone: string,
): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];

  for (const slot of timeSlots) {
    const dayKey = getFestivalDayKey(slot.time.toISOString(), timezone);
    if (!dayKey) continue;

    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.dayKey === dayKey) {
      lastGroup.slots.push(slot);
    } else {
      groups.push({ dayKey, slots: [slot] });
    }
  }

  return groups;
}

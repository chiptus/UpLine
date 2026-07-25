import { getFestivalDayKey } from "@/lib/timeUtils";

export interface DayGroupable {
  time: Date;
}

export interface DayGroup<T extends DayGroupable> {
  dayKey: string;
  slots: T[];
}

// Groups already-sorted time slots into per-festival-day buckets, computing
// day boundaries in the festival timezone so a post-midnight set lands
// under the correct calendar day rather than the viewer's local day.
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

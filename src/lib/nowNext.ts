import { isValid, parseISO } from "date-fns";

export type NowNextSet = {
  id: string;
  time_start: string | null;
  time_end: string | null;
};

export type NowNextClassification<T> = {
  nowPlaying: T[];
  next: T[];
  laterPast: T[];
};

// Pure now/next classifier for Live mode. Compares UTC instants, so it is
// festival-timezone-correct by construction; `now` is injected like in
// getFestivalPhase. Sets missing either time (masked below reveal level
// `full`, or unparseable) never classify — they are silently excluded.
export function classifyNowNext<T extends NowNextSet>(
  sets: T[],
  now: Date,
): NowNextClassification<T> {
  const timed = sets
    .flatMap((set) => {
      const start = parseInstant(set.time_start);
      const end = parseInstant(set.time_end);
      return start && end ? [{ set, start, end }] : [];
    })
    .sort(
      (a, b) =>
        a.start.getTime() - b.start.getTime() ||
        a.set.id.localeCompare(b.set.id),
    );

  const nowMs = now.getTime();
  const nextStartMs = timed.find(
    (s) => s.start.getTime() > nowMs,
  )?.start.getTime();

  const nowPlaying: T[] = [];
  const next: T[] = [];
  const laterPast: T[] = [];

  for (const { set, start, end } of timed) {
    if (start.getTime() <= nowMs && nowMs < end.getTime()) {
      nowPlaying.push(set);
    } else if (start.getTime() === nextStartMs) {
      next.push(set);
    } else {
      laterPast.push(set);
    }
  }

  return { nowPlaying, next, laterPast };
}

function parseInstant(iso: string | null): Date | null {
  if (!iso) return null;
  const date = parseISO(iso);
  return isValid(date) ? date : null;
}

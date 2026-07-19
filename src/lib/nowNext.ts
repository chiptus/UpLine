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

// Per-stage variant for the Now board: each stage's "next" is its own nearest
// upcoming set, not the globally nearest one (which turns into noise once many
// stages run concurrently). Stage-less sets are excluded.
export function classifyNowNextByStage<
  T extends NowNextSet & { stage_id: string | null },
>(sets: T[], now: Date): Map<string, NowNextClassification<T>> {
  const byStage = new Map<string, T[]>();
  for (const set of sets) {
    if (!set.stage_id) continue;
    const group = byStage.get(set.stage_id) ?? [];
    group.push(set);
    byStage.set(set.stage_id, group);
  }

  const classified = new Map<string, NowNextClassification<T>>();
  for (const [stageId, stageSets] of byStage) {
    classified.set(stageId, classifyNowNext(stageSets, now));
  }
  return classified;
}

function parseInstant(iso: string | null): Date | null {
  if (!iso) return null;
  const date = parseISO(iso);
  return isValid(date) ? date : null;
}

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

/**
 * Answers "what's on right now, and what starts next?" for a list of sets —
 * the data behind the Live phase's "Now" schedule view.
 *
 * Splits the sets into three groups relative to `now`: `nowPlaying` (on
 * stage at this moment), `next` (the set or sets sharing the nearest
 * upcoming start), and `laterPast` (everything else — already over or
 * further out). Sets without both times — e.g. masked below reveal level
 * `full` — are left out entirely. `now` is injected, keeping this a pure
 * function like getFestivalPhase.
 */
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

/**
 * classifyNowNext applied per stage, keyed by stage_id — the "Now" board
 * renders one row per stage, and each stage's `next` must be its own nearest
 * upcoming set (with many stages, the globally nearest start is noise).
 * Stage-less sets are excluded.
 */
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

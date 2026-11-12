import type { DiffResult } from "./types";

type SetToUpdate = DiffResult["cleanOperations"]["setsToUpdate"][number];

export type FieldKey =
  | "name"
  | "stage"
  | "timeStart"
  | "timeEnd"
  | "status"
  | "type"
  | "description";

export type FieldChange = {
  field: FieldKey;
  stored: string | null;
  incoming: string | null;
};

/**
 * `resolveStageName` maps the CSV stage name to the one the commit will use,
 * so a mismatch the admin resolves to the stored stage isn't reported as a change.
 */
export function getFieldChanges(
  set: SetToUpdate,
  resolveStageName: (stageName: string | null) => string | null = identity,
): FieldChange[] {
  const { previous } = set;
  const changes: FieldChange[] = [];
  push("name", previous.name, set.name);
  // The commit keeps the stored stage / start / end when the incoming value
  // is null, so only a non-null value (or a TBA status clearing the end) can change them.
  const incomingStage = resolveStageName(set.stageName);
  push("stage", previous.stageName, incomingStage ?? previous.stageName);
  push(
    "timeStart",
    previous.timeStart,
    set.timeStart ?? previous.timeStart,
    sameInstant,
  );
  push("timeEnd", previous.timeEnd, incomingEnd(), sameInstant);
  push(
    "status",
    previous.status,
    set.timeStart === null ? previous.status : set.status,
  );
  // A blank CSV type keeps the stored one, so it is never a change.
  if (set.setType !== null) push("type", previous.setType, set.setType);
  push("description", previous.description, set.description);
  return changes;

  function incomingEnd(): string | null {
    if (set.timeStart === null) return previous.timeEnd;
    if (set.status === "tba") return null;
    return set.timeEnd ?? previous.timeEnd;
  }

  function push(
    field: FieldKey,
    stored: string | null,
    incoming: string | null,
    isSame: (a: string | null, b: string | null) => boolean = sameText,
  ) {
    if (!isSame(stored, incoming)) {
      changes.push({ field, stored, incoming });
    }
  }
}

function identity<T>(value: T): T {
  return value;
}

function sameText(a: string | null, b: string | null): boolean {
  return (a ?? "") === (b ?? "");
}

/**
 * Stored timestamps and the differ's output can use different ISO spellings
 * of the same instant (Z vs +00:00).
 */
function sameInstant(a: string | null, b: string | null): boolean {
  if (a === null || b === null) return a === b;
  return new Date(a).getTime() === new Date(b).getTime();
}

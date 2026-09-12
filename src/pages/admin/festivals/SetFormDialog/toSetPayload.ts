import { convertLocalTimeToUTC } from "@/lib/timeUtils";
import { SetFormData } from "./setFormSchema";

export function toSetPayload(
  data: SetFormData,
  editionId: string,
  timezone: string,
) {
  const isTba = data.status === "tba";

  return {
    name: data.name,
    description: data.description || null,
    festival_edition_id: editionId,
    stage_id: data.stage_id && data.stage_id !== "none" ? data.stage_id : null,
    status: data.status,
    // A TBA set's time_start is a midnight placeholder for its date, with no
    // end -- "sometime that day" has no known duration.
    time_start: isTba
      ? convertLocalTimeToUTC(
          data.tba_date ? `${data.tba_date}T00:00` : undefined,
          timezone,
        )
      : data.time_start
        ? convertLocalTimeToUTC(data.time_start, timezone)
        : null,
    time_end: isTba
      ? null
      : data.time_end
        ? convertLocalTimeToUTC(data.time_end, timezone)
        : null,
    set_type: data.set_type ?? null,
    external_url: data.external_url || null,
  };
}

import { convertLocalTimeToUTC } from "@/lib/timeUtils";
import { SetFormData } from "./setFormSchema";

export function toSetPayload(
  data: SetFormData,
  editionId: string,
  timezone: string,
) {
  return {
    name: data.name,
    description: data.description || null,
    festival_edition_id: editionId,
    stage_id: data.stage_id && data.stage_id !== "none" ? data.stage_id : null,
    time_start: data.time_start
      ? convertLocalTimeToUTC(data.time_start, timezone)
      : null,
    time_end: data.time_end
      ? convertLocalTimeToUTC(data.time_end, timezone)
      : null,
  };
}

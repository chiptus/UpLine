import { convertLocalTimeToUTC, combineDateAndTime } from "@/lib/timeUtils";

export interface TimeValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateTimeString(
  timeString: string | undefined,
  dateString: string | undefined,
  timezone: string,
): TimeValidationResult {
  if (dateString && timeString) {
    const combined = combineDateAndTime(dateString, timeString);
    if (!combined) {
      return {
        isValid: false,
        error: "Failed to combine date and time",
      };
    }

    try {
      const result = convertLocalTimeToUTC(combined, timezone);
      if (result === null) {
        return {
          isValid: false,
          error: "Invalid date/time format",
        };
      }
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Invalid format",
      };
    }
  }

  if (!timeString) {
    return { isValid: true };
  }

  try {
    const result = convertLocalTimeToUTC(timeString, timezone);
    if (result === null) {
      return {
        isValid: false,
        error: "Invalid date/time format",
      };
    }
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Invalid format",
    };
  }
}

export interface SetValidationResult {
  isValid: boolean;
  rowIndex: number;
  errors: {
    time_start?: string;
    time_end?: string;
    stage_name?: string;
    artist_names?: string;
  };
}

export function validateSetData(
  set: {
    stage_name: string;
    artist_names: string;
    time_start?: string;
    date_start?: string;
    time_end?: string;
    date_end?: string;
  },
  rowIndex: number,
  timezone: string,
): SetValidationResult {
  const errors: SetValidationResult["errors"] = {};

  if (!set.stage_name || set.stage_name.trim() === "") {
    errors.stage_name = "Stage name is required";
  }

  if (!set.artist_names || set.artist_names.trim() === "") {
    errors.artist_names = "Artist name(s) required";
  }

  const timeStartValidation = validateTimeString(
    set.time_start,
    set.date_start,
    timezone,
  );
  if (!timeStartValidation.isValid) {
    errors.time_start = timeStartValidation.error;
  }

  const timeEndValidation = validateTimeString(
    set.time_end,
    set.date_end,
    timezone,
  );
  if (!timeEndValidation.isValid) {
    errors.time_end = timeEndValidation.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    rowIndex,
    errors,
  };
}

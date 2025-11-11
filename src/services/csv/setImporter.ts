import { supabase } from "@/integrations/supabase/client";
import { generateSlug } from "@/lib/slug";
import { convertLocalTimeToUTC, combineDateAndTime } from "@/lib/timeUtils";
import type { SetImportData } from "./csvParser";
import type { ImportResult } from "./types";
import type {
  ImportConflict,
  ConflictResolution,
  ImportCandidate,
} from "./conflictDetector";
import { createArtistIdMap } from "./artistResolver";

function generateSetNameFromArtists(artistNames: string[]): string {
  if (artistNames.length === 0) return "Unnamed Set";
  if (artistNames.length === 1) return artistNames[0];
  if (artistNames.length === 2) return `${artistNames[0]} & ${artistNames[1]}`;
  return `${artistNames[0]} & ${artistNames.length - 1} others`;
}

export async function importSetsWithConflictResolution(
  sets: SetImportData[],
  editionId: string,
  resolutions: Map<number, ConflictResolution>,
  conflicts: ImportConflict[],
  candidatesWithoutConflicts: ImportCandidate[],
  timezone: string = "UTC",
  onProgress?: (completed: number, total: number) => void,
): Promise<ImportResult> {
  const currentUser = await supabase.auth.getUser();
  const userId = currentUser.data.user?.id || "";

  // Create artist ID mapping
  const artistIdMap = await createArtistIdMap(
    conflicts,
    candidatesWithoutConflicts,
    resolutions,
    userId,
  );

  // Now proceed with the original import logic, but use the resolved artist IDs
  return importSetsWithArtistMap(
    sets,
    editionId,
    artistIdMap,
    timezone,
    onProgress,
  );
}

async function importSetsWithArtistMap(
  sets: SetImportData[],
  editionId: string,
  artistIdMap: Map<string, string>,
  timezone: string = "UTC",
  onProgress?: (completed: number, total: number) => void,
): Promise<ImportResult> {
  const currentUser = await supabase.auth.getUser();
  const userId = currentUser.data.user?.id || "";

  const results = [];
  const errors = [];
  const total = sets.length;

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    try {
      // Parse artist names
      const artistNames = set.artist_names
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

      if (artistNames.length === 0) {
        errors.push(`Set "${set.name || "Unnamed"}" has no artists specified`);
        continue;
      }

      // Generate set name if not provided
      const setName = set.name || generateSetNameFromArtists(artistNames);

      // Get artist IDs from the resolved map or try to find existing ones
      const artistIds: string[] = [];
      console.log(`Processing set "${setName}" with artists:`, artistNames);

      for (const artistName of artistNames) {
        let artistId = artistIdMap.get(artistName);
        console.log(
          `Looking for artist "${artistName}":`,
          artistId ? `Found in map: ${artistId}` : "Not in map",
        );

        if (!artistId) {
          // Try to find existing artist as fallback
          const { data: existingArtist } = await supabase
            .from("artists")
            .select("id")
            .eq("name", artistName)
            .limit(1);

          if (existingArtist && existingArtist.length > 0) {
            artistId = existingArtist[0].id;
            console.log(`Found existing artist "${artistName}": ${artistId}`);
          } else {
            errors.push(`Artist "${artistName}" could not be resolved`);
            console.error(
              `Artist "${artistName}" could not be resolved - not in map and not found in database`,
            );
            continue;
          }
        }

        artistIds.push(artistId);
      }

      console.log(`Final artist IDs for set "${setName}":`, artistIds);

      if (artistIds.length === 0) {
        errors.push(`Set "${set.name || "Unnamed"}" has no valid artists`);
        continue;
      }

      // Continue with set creation logic (same as original)

      let stageId = "";
      if (set.stage_name) {
        const { data: stage, error: stageError } = await supabase
          .from("stages")
          .select("id")
          .eq("name", set.stage_name)
          .eq("festival_edition_id", editionId)
          .single();

        if (stageError || !stage) {
          errors.push(
            `Stage "${set.stage_name}" not found for set "${setName}"`,
          );
          continue;
        }

        stageId = stage.id;
      }

      // Check if set already exists
      const setQuery = supabase
        .from("sets")
        .select("id")
        .eq("name", setName)
        .eq("festival_edition_id", editionId);

      if (stageId) {
        setQuery.eq("stage_id", stageId);
      }

      const { data: existingSet } = await setQuery.limit(1);

      // Convert times to UTC, combining date and time fields if both are present
      const timeStartInput =
        set.date_start && set.time_start
          ? combineDateAndTime(set.date_start, set.time_start)
          : set.time_start;
      const timeEndInput =
        set.date_end && set.time_end
          ? combineDateAndTime(set.date_end, set.time_end)
          : set.time_end;

      if (!timeStartInput) {
        throw new Error("Missing time start");
      }

      if (!timeEndInput) {
        throw new Error("Missing time end");
      }

      const utcTimeStart = convertLocalTimeToUTC(timeStartInput, timezone);
      const utcTimeEnd = convertLocalTimeToUTC(timeEndInput, timezone);

      let createdSetId = "";
      let setError;

      if (existingSet && existingSet.length === 1) {
        createdSetId = existingSet[0].id;
        // Update existing set
        const { error } = await supabase
          .from("sets")
          .update({
            time_start: utcTimeStart,
            time_end: utcTimeEnd,
            description: set.description || null,
            archived: false,
          })
          .eq("id", createdSetId);

        setError = error;
      } else {
        // Create new set
        const { data, error } = await supabase
          .from("sets")
          .insert({
            name: setName,
            slug: generateSlug(setName),
            stage_id: stageId || null,
            festival_edition_id: editionId,
            time_start: utcTimeStart,
            time_end: utcTimeEnd,
            description: set.description || null,
            archived: false,
            created_by: userId,
          })
          .select("id")
          .single();

        createdSetId = data?.id || "";
        setError = error;
      }

      if (setError || !createdSetId) {
        errors.push(
          `Failed to create set "${setName}": ${setError?.message || "No ID"}`,
        );
        continue;
      }

      // Link artists to set
      for (const artistId of artistIds) {
        await supabase.from("set_artists").upsert(
          {
            set_id: createdSetId,
            artist_id: artistId,
          },
          {
            onConflict: "set_id,artist_id",
            ignoreDuplicates: true,
          },
        );
      }

      results.push(setName);
    } catch (error) {
      errors.push(
        `Error processing set: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    onProgress?.(i + 1, total);
  }

  if (errors.length > 0 && results.length === 0) {
    return {
      success: false,
      message: "Failed to import sets",
      errors,
    };
  }

  return {
    success: true,
    message: `Successfully imported ${results.length} sets${errors.length > 0 ? ` (${errors.length} errors)` : ""}`,
    inserted: results.length,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export async function importSets(
  sets: SetImportData[],
  editionId: string,
  timezone: string = "UTC",
  onProgress?: (completed: number, total: number) => void,
): Promise<ImportResult> {
  // Use the artistMap version but with an empty map (original behavior)
  return importSetsWithArtistMap(
    sets,
    editionId,
    new Map(),
    timezone,
    onProgress,
  );
}

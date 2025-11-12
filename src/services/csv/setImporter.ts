import { supabase } from "@/integrations/supabase/client";
import { generateSlug } from "@/lib/slug";
import { convertLocalTimeToUTC, combineDateAndTime } from "@/lib/timeUtils";
import type { SetImportData } from "./csvParser";
import type { ImportResult } from "./types";
import type { SetSelection } from "@/pages/admin/festivals/CSVImportDialog/SetsPreviewTable";
import { duplicateSetWithVotes } from "./setDuplicator";

function generateSetNameFromArtists(artistNames: string[]): string {
  if (artistNames.length === 0) return "Unnamed Set";
  if (artistNames.length === 1) return artistNames[0];
  if (artistNames.length === 2) return `${artistNames[0]} & ${artistNames[1]}`;
  return `${artistNames[0]} & ${artistNames.length - 1} others`;
}

export interface ArtistMapping {
  csvName: string;
  artistId: string | null;
  shouldCreate: boolean;
}

async function importSetsWithArtistMap({
  artistMappings,
  editionId,
  sets,
  timezone = "UTC",
  onProgress,
  setSelections,
}: {
  sets: SetImportData[];
  editionId: string;
  artistMappings: Map<number, ArtistMapping[]>;
  setSelections?: Map<number, SetSelection>;
  timezone?: string;
  onProgress?: (completed: number, total: number) => void;
}): Promise<ImportResult> {
  const currentUser = await supabase.auth.getUser();
  const userId = currentUser.data.user?.id || "";

  const results: Array<string> = [];
  const errors: Array<string> = [];
  const total = sets.length;

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    const setMappings = artistMappings.get(i);
    const setSelection = setSelections?.get(i);

    const response = await importSingleSet({
      importedSet: set,
      setMappings,
      setSelection,
      editionId,
      timezone,
      userId,
    });

    if (response.type === "error") {
      errors.push(...response.errors);
      continue;
    } else {
      results.push(response.setName);
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

async function importSingleSet({
  importedSet,
  setMappings,
  userId,
  timezone,
  editionId,
  setSelection,
}: {
  timezone: string;
  userId: string;
  importedSet: SetImportData;
  setMappings: ArtistMapping[] | undefined;
  editionId: string;
  setSelection: SetSelection | undefined;
}): Promise<
  | {
      type: "error";
      errors: string[];
    }
  | {
      type: "success";
      setName: string;
    }
> {
  const errors: string[] = [];
  try {
    if (!setMappings || setMappings.length === 0) {
      errors.push(
        `Set "${importedSet.name || "Unnamed"}" has no artist mappings`,
      );
      return { type: "error", errors };
    }

    const artistNames = setMappings.map((m) => m.csvName);
    const setName = importedSet.name || generateSetNameFromArtists(artistNames);

    const artistIds: string[] = [];

    for (const mapping of setMappings) {
      let artistId = mapping.artistId;

      if (!artistId && mapping.shouldCreate) {
        const { data: newArtist, error: createError } = await supabase
          .from("artists")
          .insert({
            name: mapping.csvName,
            slug: generateSlug(mapping.csvName),
            added_by: userId,
          })
          .select("id")
          .single();

        if (createError || !newArtist) {
          errors.push(
            `Failed to create artist "${mapping.csvName}": ${createError?.message || "No ID"}`,
          );
          continue;
        }

        artistId = newArtist.id;
      }

      if (!artistId) {
        errors.push(`Artist "${mapping.csvName}" could not be resolved`);
        continue;
      }

      artistIds.push(artistId);
    }

    if (artistIds.length === 0) {
      errors.push(
        `Set "${importedSet.name || "Unnamed"}" has no valid artists`,
      );
      return { type: "error", errors };
    }

    // Continue with set creation logic (same as original)

    let stageId = "";
    if (importedSet.stage_name) {
      const { data: stage, error: stageError } = await supabase
        .from("stages")
        .select("id")
        .eq("name", importedSet.stage_name)
        .eq("festival_edition_id", editionId)
        .single();

      if (stageError || !stage) {
        errors.push(
          `Stage "${importedSet.stage_name}" not found for set "${setName}"`,
        );
        return { type: "error", errors };
      }

      stageId = stage.id;
    }

    const timeStartInput =
      importedSet.date_start && importedSet.time_start
        ? combineDateAndTime(importedSet.date_start, importedSet.time_start)
        : importedSet.time_start;
    const timeEndInput =
      importedSet.date_end && importedSet.time_end
        ? combineDateAndTime(importedSet.date_end, importedSet.time_end)
        : importedSet.time_end;

    if (!timeStartInput) {
      errors.push("Missing time start");
      return { type: "error", errors };
    }

    if (!timeEndInput) {
      errors.push("Missing time end");
      return { type: "error", errors };
    }

    const utcTimeStart = convertLocalTimeToUTC(timeStartInput, timezone);
    const utcTimeEnd = convertLocalTimeToUTC(timeEndInput, timezone);

    if (!utcTimeEnd || !utcTimeStart) {
      errors.push("Time is not valid");
      return { type: "error", errors };
    }

    let createdSetId = "";
    let setError: Error | null = null;

    if (setSelection?.action === "match" && setSelection.matchedSetId) {
      createdSetId = setSelection.matchedSetId;
      const { error } = await supabase
        .from("sets")
        .update({
          time_start: utcTimeStart,
          time_end: utcTimeEnd,
          description: importedSet.description || null,
          archived: false,
        })
        .eq("id", createdSetId);

      setError = error;
    } else if (
      setSelection?.action === "duplicate" &&
      setSelection.matchedSetId
    ) {
      try {
        createdSetId = await duplicateSetWithVotes(
          setSelection.matchedSetId,
          utcTimeStart!,
          utcTimeEnd!,
        );
      } catch (error) {
        setError = error as Error;
      }
    } else {
      const { data, error } = await supabase
        .from("sets")
        .insert({
          name: setName,
          slug: generateSlug(setName),
          stage_id: stageId || null,
          festival_edition_id: editionId,
          time_start: utcTimeStart,
          time_end: utcTimeEnd,
          description: importedSet.description || null,
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
      return { type: "error", errors };
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

    return { type: "success", setName };
  } catch (error) {
    errors.push(
      `Error processing set: ${error instanceof Error ? error.message : "Unknown error"}`,
    );

    return { errors, type: "error" };
  }
}

export async function importSets(
  sets: SetImportData[],
  editionId: string,
  timezone: string = "UTC",
  onProgress?: (completed: number, total: number) => void,
): Promise<ImportResult> {
  const artistMappings = new Map<number, ArtistMapping[]>();

  sets.forEach((set, index) => {
    const artistNames = set.artist_names
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    artistMappings.set(
      index,
      artistNames.map((csvName) => ({
        csvName,
        artistId: null,
        shouldCreate: true,
      })),
    );
  });

  return importSetsWithArtistMap({
    sets,
    editionId,
    artistMappings: artistMappings,
    timezone,
    onProgress,
  });
}

export async function importSetsWithMappings(
  sets: SetImportData[],
  editionId: string,
  artistMappings: Map<number, ArtistMapping[]>,
  setSelections?: Map<number, SetSelection>,
  timezone: string = "UTC",
  onProgress?: (completed: number, total: number) => void,
): Promise<ImportResult> {
  return importSetsWithArtistMap({
    sets,
    editionId,
    artistMappings,
    setSelections,
    timezone,
    onProgress,
  });
}

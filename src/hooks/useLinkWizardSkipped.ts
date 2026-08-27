import { z } from "zod";
import { useLocalStorageState } from "./useLocalStorageState";

const SKIPPED_KEY = "link-wizard-skipped";
const SKIPPED_VERSION = "1.0";

const artistSkipRecordSchema = z.object({
  artistId: z.string(),
  status: z.enum(["skipped", "saved"]),
  timestamp: z.number(),
});

const editionSkippedStateSchema = z.object({
  records: z.record(z.string(), artistSkipRecordSchema),
  version: z.string(),
  timestamp: z.number(),
});

const linkWizardSkippedStateSchema = z.record(
  z.string(),
  editionSkippedStateSchema,
);

export type ArtistSkipRecord = z.infer<typeof artistSkipRecordSchema>;
type EditionSkippedState = z.infer<typeof editionSkippedStateSchema>;
export type LinkWizardSkippedState = z.infer<
  typeof linkWizardSkippedStateSchema
>;

function emptyEditionState(): EditionSkippedState {
  return {
    records: {},
    version: SKIPPED_VERSION,
    timestamp: Date.now(),
  };
}

export function useLinkWizardSkipped(editionId: string) {
  const [allState, setAllState] = useLocalStorageState(
    SKIPPED_KEY,
    linkWizardSkippedStateSchema,
    {},
  );

  const editionData = allState[editionId];
  const skippedState: EditionSkippedState =
    editionData && editionData.version === SKIPPED_VERSION
      ? editionData
      : emptyEditionState();

  function saveState(newState: EditionSkippedState) {
    setAllState({ ...allState, [editionId]: newState });
  }

  function markSkipped(artistId: string) {
    saveState({
      ...skippedState,
      records: {
        ...skippedState.records,
        [artistId]: {
          artistId,
          status: "skipped" as const,
          timestamp: Date.now(),
        },
      },
      timestamp: Date.now(),
    });
  }

  function markSaved(artistId: string) {
    saveState({
      ...skippedState,
      records: {
        ...skippedState.records,
        [artistId]: {
          artistId,
          status: "saved" as const,
          timestamp: Date.now(),
        },
      },
      timestamp: Date.now(),
    });
  }

  function restore(artistId: string) {
    const newRecords = { ...skippedState.records };
    delete newRecords[artistId];
    saveState({
      ...skippedState,
      records: newRecords,
      timestamp: Date.now(),
    });
  }

  function clearAll() {
    saveState(emptyEditionState());
  }

  function getSkippedArtistIds(): string[] {
    return Object.keys(skippedState.records);
  }

  function getSkippedArtists(): ArtistSkipRecord[] {
    return Object.values(skippedState.records);
  }

  function isSkipped(artistId: string): boolean {
    return artistId in skippedState.records;
  }

  return {
    skippedState,
    markSkipped,
    markSaved,
    restore,
    clearAll,
    getSkippedArtistIds,
    getSkippedArtists,
    isSkipped,
  };
}

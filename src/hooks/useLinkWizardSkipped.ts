import { useState, useEffect } from "react";

const SKIPPED_KEY = "link-wizard-skipped";
const SKIPPED_VERSION = "1.0";

export interface ArtistSkipRecord {
  artistId: string;
  status: "skipped" | "saved";
  timestamp: number;
}

export interface LinkWizardSkippedState {
  [editionId: string]: {
    records: Record<string, ArtistSkipRecord>;
    version: string;
    timestamp: number;
  };
}

export function useLinkWizardSkipped(editionId: string) {
  const [skippedState, setSkippedState] = useState<
    LinkWizardSkippedState[string] | null
  >(null);

  useEffect(() => {
    const savedData = localStorage.getItem(SKIPPED_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData) as LinkWizardSkippedState;
        const editionData = parsed[editionId];
        if (editionData && editionData.version === SKIPPED_VERSION) {
          setSkippedState(editionData);
        } else {
          // Version mismatch or no data for this edition, start fresh
          setSkippedState({
            records: {},
            version: SKIPPED_VERSION,
            timestamp: Date.now(),
          });
        }
      } catch {
        // Malformed JSON, fall back to empty record
        setSkippedState({
          records: {},
          version: SKIPPED_VERSION,
          timestamp: Date.now(),
        });
      }
    } else {
      setSkippedState({
        records: {},
        version: SKIPPED_VERSION,
        timestamp: Date.now(),
      });
    }
  }, [editionId]);

  function saveState(newState: LinkWizardSkippedState[string]) {
    setSkippedState(newState);
    const savedData = localStorage.getItem(SKIPPED_KEY);
    let allData: LinkWizardSkippedState = {};
    if (savedData) {
      try {
        allData = JSON.parse(savedData);
      } catch {
        // Malformed data, start fresh
        allData = {};
      }
    }
    allData[editionId] = newState;
    localStorage.setItem(SKIPPED_KEY, JSON.stringify(allData));
  }

  function markSkipped(artistId: string) {
    if (!skippedState) return;
    const newState = {
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
    };
    saveState(newState);
  }

  function markSaved(artistId: string) {
    if (!skippedState) return;
    const newState = {
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
    };
    saveState(newState);
  }

  function restore(artistId: string) {
    if (!skippedState) return;
    const newRecords = { ...skippedState.records };
    delete newRecords[artistId];
    const newState = {
      ...skippedState,
      records: newRecords,
      timestamp: Date.now(),
    };
    saveState(newState);
  }

  function clearAll() {
    const newState = {
      records: {},
      version: SKIPPED_VERSION,
      timestamp: Date.now(),
    };
    saveState(newState);
  }

  function getSkippedArtistIds(): string[] {
    if (!skippedState) return [];
    return Object.keys(skippedState.records);
  }

  function getSkippedArtists(): ArtistSkipRecord[] {
    if (!skippedState) return [];
    return Object.values(skippedState.records);
  }

  function isSkipped(artistId: string): boolean {
    if (!skippedState) return false;
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

import { useState } from "react";

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

function readEditionState(editionId: string): LinkWizardSkippedState[string] {
  const savedData = localStorage.getItem(SKIPPED_KEY);
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData) as LinkWizardSkippedState;
      const editionData = parsed[editionId];
      if (editionData && editionData.version === SKIPPED_VERSION) {
        return editionData;
      }
    } catch {
      // Malformed JSON, fall back to empty record
    }
  }
  return {
    records: {},
    version: SKIPPED_VERSION,
    timestamp: Date.now(),
  };
}

export function useLinkWizardSkipped(editionId: string) {
  const [skippedState, setSkippedState] = useState<
    LinkWizardSkippedState[string]
  >(() => readEditionState(editionId));

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

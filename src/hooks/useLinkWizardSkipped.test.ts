import { describe, expect, it, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  useLinkWizardSkipped,
  type LinkWizardSkippedState,
} from "./useLinkWizardSkipped";

describe("useLinkWizardSkipped", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("initialization", () => {
    it("initializes with empty records when no stored data exists", async () => {
      const { result } = renderHook(() => useLinkWizardSkipped("edition-1"));

      await waitFor(() => {
        expect(result.current.skippedState).not.toBeNull();
        expect(result.current.skippedState?.records).toEqual({});
        expect(result.current.skippedState?.version).toBe("1.0");
      });
    });

    it("loads stored skipped data for the same edition", async () => {
      const storedData: LinkWizardSkippedState = {
        "edition-1": {
          records: {
            "artist-1": {
              artistId: "artist-1",
              status: "skipped",
              timestamp: 1234567890,
            },
          },
          version: "1.0",
          timestamp: 1234567890,
        },
      };

      localStorage.setItem("link-wizard-skipped", JSON.stringify(storedData));

      const { result } = renderHook(() => useLinkWizardSkipped("edition-1"));

      await waitFor(() => {
        expect(result.current.skippedState?.records).toEqual(
          storedData["edition-1"].records,
        );
      });
    });

    it("starts with empty records for a new edition when other editions exist", async () => {
      const storedData: LinkWizardSkippedState = {
        "edition-1": {
          records: {
            "artist-1": {
              artistId: "artist-1",
              status: "skipped",
              timestamp: 1234567890,
            },
          },
          version: "1.0",
          timestamp: 1234567890,
        },
      };

      localStorage.setItem("link-wizard-skipped", JSON.stringify(storedData));

      const { result } = renderHook(() => useLinkWizardSkipped("edition-2"));

      await waitFor(() => {
        expect(result.current.skippedState?.records).toEqual({});
      });
    });

    it("falls back to empty records when stored data has wrong version", async () => {
      const storedData: LinkWizardSkippedState = {
        "edition-1": {
          records: {
            "artist-1": {
              artistId: "artist-1",
              status: "skipped",
              timestamp: 1234567890,
            },
          },
          version: "0.9",
          timestamp: 1234567890,
        },
      };

      localStorage.setItem("link-wizard-skipped", JSON.stringify(storedData));

      const { result } = renderHook(() => useLinkWizardSkipped("edition-1"));

      await waitFor(() => {
        expect(result.current.skippedState?.records).toEqual({});
      });
    });

    it("falls back to empty records when stored JSON is malformed", async () => {
      localStorage.setItem("link-wizard-skipped", "invalid json");

      const { result } = renderHook(() => useLinkWizardSkipped("edition-1"));

      await waitFor(() => {
        expect(result.current.skippedState?.records).toEqual({});
      });
    });
  });

  describe("marking artists", () => {
    it("marks an artist as skipped and persists to localStorage", async () => {
      const { result } = renderHook(() => useLinkWizardSkipped("edition-1"));

      await waitFor(() => {
        expect(result.current.skippedState).not.toBeNull();
      });

      act(() => {
        result.current.markSkipped("artist-1");
      });

      await waitFor(() => {
        expect(result.current.skippedState?.records["artist-1"]).toBeDefined();
        expect(result.current.skippedState?.records["artist-1"].status).toBe(
          "skipped",
        );
      });

      const stored = localStorage.getItem("link-wizard-skipped");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!) as LinkWizardSkippedState;
      expect(parsed["edition-1"].records["artist-1"].status).toBe("skipped");
    });

    it("marks an artist as saved and persists to localStorage", async () => {
      const { result } = renderHook(() => useLinkWizardSkipped("edition-1"));

      await waitFor(() => {
        expect(result.current.skippedState).not.toBeNull();
      });

      act(() => {
        result.current.markSaved("artist-2");
      });

      await waitFor(() => {
        expect(result.current.skippedState?.records["artist-2"]).toBeDefined();
        expect(result.current.skippedState?.records["artist-2"].status).toBe(
          "saved",
        );
      });

      const stored = localStorage.getItem("link-wizard-skipped");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!) as LinkWizardSkippedState;
      expect(parsed["edition-1"].records["artist-2"].status).toBe("saved");
    });

    it("overwrites previous status when marking same artist with different status", async () => {
      const { result } = renderHook(() => useLinkWizardSkipped("edition-1"));

      await waitFor(() => {
        expect(result.current.skippedState).not.toBeNull();
      });

      act(() => {
        result.current.markSkipped("artist-1");
      });

      await waitFor(() => {
        expect(result.current.skippedState?.records["artist-1"].status).toBe(
          "skipped",
        );
      });

      act(() => {
        result.current.markSaved("artist-1");
      });

      await waitFor(() => {
        expect(result.current.skippedState?.records["artist-1"].status).toBe(
          "saved",
        );
      });
    });
  });

  describe("restoring artists", () => {
    it("restores a single artist by removing it from records", async () => {
      const storedData: LinkWizardSkippedState = {
        "edition-1": {
          records: {
            "artist-1": {
              artistId: "artist-1",
              status: "skipped",
              timestamp: 1234567890,
            },
            "artist-2": {
              artistId: "artist-2",
              status: "saved",
              timestamp: 1234567890,
            },
          },
          version: "1.0",
          timestamp: 1234567890,
        },
      };

      localStorage.setItem("link-wizard-skipped", JSON.stringify(storedData));

      const { result } = renderHook(() => useLinkWizardSkipped("edition-1"));

      await waitFor(() => {
        expect(result.current.skippedState?.records["artist-1"]).toBeDefined();
      });

      act(() => {
        result.current.restore("artist-1");
      });

      await waitFor(() => {
        expect(
          result.current.skippedState?.records["artist-1"],
        ).toBeUndefined();
        expect(result.current.skippedState?.records["artist-2"]).toBeDefined();
      });

      const stored = localStorage.getItem("link-wizard-skipped");
      const parsed = JSON.parse(stored!) as LinkWizardSkippedState;
      expect(Object.keys(parsed["edition-1"].records)).toEqual(["artist-2"]);
    });

    it("restores nonexistent artist without error", async () => {
      const { result } = renderHook(() => useLinkWizardSkipped("edition-1"));

      await waitFor(() => {
        expect(result.current.skippedState).not.toBeNull();
      });

      expect(() => {
        act(() => {
          result.current.restore("nonexistent-artist");
        });
      }).not.toThrow();
    });
  });

  describe("clearing all", () => {
    it("clears all records for the edition", async () => {
      const storedData: LinkWizardSkippedState = {
        "edition-1": {
          records: {
            "artist-1": {
              artistId: "artist-1",
              status: "skipped",
              timestamp: 1234567890,
            },
            "artist-2": {
              artistId: "artist-2",
              status: "saved",
              timestamp: 1234567890,
            },
          },
          version: "1.0",
          timestamp: 1234567890,
        },
      };

      localStorage.setItem("link-wizard-skipped", JSON.stringify(storedData));

      const { result } = renderHook(() => useLinkWizardSkipped("edition-1"));

      await waitFor(() => {
        expect(
          Object.keys(result.current.skippedState?.records || {}),
        ).toHaveLength(2);
      });

      act(() => {
        result.current.clearAll();
      });

      await waitFor(() => {
        expect(result.current.skippedState?.records).toEqual({});
      });

      const stored = localStorage.getItem("link-wizard-skipped");
      const parsed = JSON.parse(stored!) as LinkWizardSkippedState;
      expect(Object.keys(parsed["edition-1"].records)).toEqual([]);
    });

    it("preserves other editions when clearing one", async () => {
      const storedData: LinkWizardSkippedState = {
        "edition-1": {
          records: {
            "artist-1": {
              artistId: "artist-1",
              status: "skipped",
              timestamp: 1234567890,
            },
          },
          version: "1.0",
          timestamp: 1234567890,
        },
        "edition-2": {
          records: {
            "artist-2": {
              artistId: "artist-2",
              status: "saved",
              timestamp: 1234567890,
            },
          },
          version: "1.0",
          timestamp: 1234567890,
        },
      };

      localStorage.setItem("link-wizard-skipped", JSON.stringify(storedData));

      const { result } = renderHook(() => useLinkWizardSkipped("edition-1"));

      await waitFor(() => {
        expect(result.current.skippedState?.records["artist-1"]).toBeDefined();
      });

      act(() => {
        result.current.clearAll();
      });

      await waitFor(() => {
        expect(result.current.skippedState?.records).toEqual({});
      });

      const stored = localStorage.getItem("link-wizard-skipped");
      const parsed = JSON.parse(stored!) as LinkWizardSkippedState;
      expect(Object.keys(parsed["edition-2"].records)).toEqual(["artist-2"]);
    });
  });

  describe("querying", () => {
    it("getSkippedArtistIds returns array of skipped artist IDs", async () => {
      const storedData: LinkWizardSkippedState = {
        "edition-1": {
          records: {
            "artist-1": {
              artistId: "artist-1",
              status: "skipped",
              timestamp: 1234567890,
            },
            "artist-2": {
              artistId: "artist-2",
              status: "saved",
              timestamp: 1234567890,
            },
          },
          version: "1.0",
          timestamp: 1234567890,
        },
      };

      localStorage.setItem("link-wizard-skipped", JSON.stringify(storedData));

      const { result } = renderHook(() => useLinkWizardSkipped("edition-1"));

      await waitFor(() => {
        expect(result.current.getSkippedArtistIds()).toHaveLength(2);
      });

      expect(result.current.getSkippedArtistIds()).toEqual(
        expect.arrayContaining(["artist-1", "artist-2"]),
      );
    });

    it("getSkippedArtists returns array of skip records", async () => {
      const storedData: LinkWizardSkippedState = {
        "edition-1": {
          records: {
            "artist-1": {
              artistId: "artist-1",
              status: "skipped",
              timestamp: 1234567890,
            },
          },
          version: "1.0",
          timestamp: 1234567890,
        },
      };

      localStorage.setItem("link-wizard-skipped", JSON.stringify(storedData));

      const { result } = renderHook(() => useLinkWizardSkipped("edition-1"));

      await waitFor(() => {
        expect(result.current.getSkippedArtists()).toHaveLength(1);
      });

      expect(result.current.getSkippedArtists()[0]).toEqual({
        artistId: "artist-1",
        status: "skipped",
        timestamp: 1234567890,
      });
    });

    it("isSkipped returns true for skipped/saved artist", async () => {
      const storedData: LinkWizardSkippedState = {
        "edition-1": {
          records: {
            "artist-1": {
              artistId: "artist-1",
              status: "skipped",
              timestamp: 1234567890,
            },
          },
          version: "1.0",
          timestamp: 1234567890,
        },
      };

      localStorage.setItem("link-wizard-skipped", JSON.stringify(storedData));

      const { result } = renderHook(() => useLinkWizardSkipped("edition-1"));

      await waitFor(() => {
        expect(result.current.isSkipped("artist-1")).toBe(true);
      });

      expect(result.current.isSkipped("artist-2")).toBe(false);
    });
  });

  describe("persistence across hook instances", () => {
    it("reflects changes from one instance in another instance of same edition", async () => {
      const { result: result1 } = renderHook(() =>
        useLinkWizardSkipped("edition-1"),
      );

      await waitFor(() => {
        expect(result1.current.skippedState).not.toBeNull();
      });

      act(() => {
        result1.current.markSkipped("artist-1");
      });

      await waitFor(() => {
        expect(result1.current.isSkipped("artist-1")).toBe(true);
      });

      const { result: result2 } = renderHook(() =>
        useLinkWizardSkipped("edition-1"),
      );

      await waitFor(() => {
        expect(result2.current.isSkipped("artist-1")).toBe(true);
      });
    });
  });
});

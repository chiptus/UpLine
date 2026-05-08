import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Upload,
} from "lucide-react";
import type { SetImportData } from "@/services/csv/csvParser";
import {
  validateSetData,
  type SetValidationResult,
} from "@/services/csv/timeValidator";
import { useState, useEffect, useMemo } from "react";
import { useArtistsQuery } from "@/hooks/queries/artists/useArtists";
import { useMatchingSetsQuery } from "@/hooks/queries/sets/useMatchingSetsQuery";
import { SetPreviewRow } from "./SetPreviewRow";
import type { ArtistMapping } from "@/services/csv/setImporter";
import type { ImportResult } from "@/services/csv/types";

export interface ArtistSelection {
  csvName: string;
  artistId: string | null;
  isCreating: boolean;
}

export interface SetSelection {
  action: "match" | "duplicate" | "create";
  matchedSetId?: string;
}

const PAGE_SIZE = 20;

interface SetsPreviewTableProps {
  sets: SetImportData[];
  timezone: string;
  editionId: string;
  onImportPage: (
    pageSets: SetImportData[],
    artistMappings: Map<number, ArtistMapping[]>,
    setSelections: Map<number, SetSelection>,
    onProgress?: (completed: number, total: number) => void,
  ) => Promise<ImportResult>;
}

export function SetsPreviewTable({
  sets,
  timezone,
  editionId,
  onImportPage,
}: SetsPreviewTableProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [importedPages, setImportedPages] = useState<Set<number>>(new Set());
  const [pageResults, setPageResults] = useState<Map<number, ImportResult>>(
    new Map(),
  );
  const [isImportingPage, setIsImportingPage] = useState(false);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
  });

  const [artistSelections, setArtistSelections] = useState<
    Map<number, ArtistSelection[]>
  >(new Map());
  const [setSelections, setSetSelections] = useState<Map<number, SetSelection>>(
    new Map(),
  );

  const totalPages = Math.ceil(sets.length / PAGE_SIZE);
  const pageStart = currentPage * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, sets.length);
  const pageSets = useMemo(
    () => sets.slice(pageStart, pageEnd),
    [sets, pageStart, pageEnd],
  );

  const artistsQuery = useArtistsQuery();
  const matchingSetsQuery = useMatchingSetsQuery(pageSets, editionId);

  const matchingSets = matchingSetsQuery.data || new Map();
  const isLoadingMatches = matchingSetsQuery.isLoading;

  const artistsByName = useMemo(() => {
    const map = new Map<string, string>();
    artistsQuery.data?.forEach((artist) => {
      map.set(artist.name.toLowerCase(), artist.id);
    });
    return map;
  }, [artistsQuery.data]);

  // Initialize artist selections for all sets (pure JS, fast)
  useEffect(() => {
    const initialArtistSelections = new Map<number, ArtistSelection[]>(
      artistSelections,
    );

    sets.forEach((set, index) => {
      if (initialArtistSelections.has(index)) return;

      const artistNames = set.artist_names
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

      initialArtistSelections.set(
        index,
        artistNames.map((csvName) => {
          const artistId = artistsByName.get(csvName.toLowerCase());
          return { csvName, artistId: artistId || null, isCreating: !artistId };
        }),
      );
    });

    setArtistSelections(initialArtistSelections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sets, artistsByName]);

  // Initialize set selections for current page when matches load
  useEffect(() => {
    if (!matchingSetsQuery.data) return;

    const updated = new Map<number, SetSelection>(setSelections);

    pageSets.forEach((_set, localIndex) => {
      const originalIndex = pageStart + localIndex;
      if (updated.has(originalIndex)) return;

      const matchingSetsForRow = matchingSetsQuery.data?.get(localIndex) || [];
      updated.set(
        originalIndex,
        matchingSetsForRow.length > 0
          ? { action: "match", matchedSetId: matchingSetsForRow[0].id }
          : { action: "create" },
      );
    });

    setSetSelections(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchingSetsQuery.data, pageStart]);

  if (sets.length === 0) {
    return null;
  }

  const pageValidationResults: SetValidationResult[] = pageSets.map(
    (set, localIndex) => validateSetData(set, pageStart + localIndex, timezone),
  );

  const totalValidCount = sets.reduce((acc, set, index) => {
    const result = validateSetData(set, index, timezone);
    return acc + (result.isValid ? 1 : 0);
  }, 0);
  const totalInvalidCount = sets.length - totalValidCount;

  const hasSeparateDateFields = sets.some(
    (set) => set.date_start !== undefined || set.date_end !== undefined,
  );

  const currentPageResult = pageResults.get(currentPage);
  const isCurrentPageImported = importedPages.has(currentPage);
  const allPagesImported = importedPages.size === totalPages;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">
            Preview: {sets.length} set{sets.length !== 1 ? "s" : ""} (timezone:{" "}
            {timezone})
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            {totalValidCount > 0 && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                {totalValidCount} valid
              </Badge>
            )}
            {totalInvalidCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {totalInvalidCount} invalid
              </Badge>
            )}
            {allPagesImported && (
              <Badge
                variant="outline"
                className="gap-1 border-green-500 text-green-700"
              >
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                All pages imported
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Artist(s)</TableHead>
                {hasSeparateDateFields ? (
                  <>
                    <TableHead>Date Start</TableHead>
                    <TableHead>Time Start</TableHead>
                    <TableHead>Date End</TableHead>
                    <TableHead>Time End</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                  </>
                )}
                <TableHead>Set Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Matching Set</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageSets.map((set, localIndex) => {
                const originalIndex = pageStart + localIndex;
                return (
                  <SetPreviewRow
                    key={originalIndex}
                    set={set}
                    index={originalIndex}
                    validation={pageValidationResults[localIndex]}
                    hasSeparateDateFields={hasSeparateDateFields}
                    matchingSets={matchingSets.get(localIndex) || []}
                    setSelection={setSelections.get(originalIndex)}
                    artistSelections={artistSelections.get(originalIndex) || []}
                    isLoadingMatches={isLoadingMatches}
                    editionId={editionId}
                    onArtistSelectionChange={handleArtistSelectionChange}
                    onSetSelectionChange={handleSetSelectionChange}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 0 || isImportingPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => !isImportingPage && setCurrentPage(i)}
                  className={[
                    "h-7 w-7 rounded text-xs font-medium transition-colors",
                    i === currentPage
                      ? "bg-primary text-primary-foreground"
                      : importedPages.has(i)
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "hover:bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages - 1 || isImportingPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Rows {pageStart + 1}–{pageEnd} of {sets.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentPageResult && (
              <span
                className={`text-sm ${currentPageResult.success ? "text-green-600" : "text-destructive"}`}
              >
                {currentPageResult.success
                  ? `✓ ${currentPageResult.inserted ?? 0} imported`
                  : `✗ ${currentPageResult.message}`}
                {(currentPageResult.errors?.length ?? 0) > 0 &&
                  ` (${currentPageResult.errors!.length} errors)`}
              </span>
            )}
            {isImportingPage && importProgress.total > 0 && (
              <span className="text-sm text-muted-foreground">
                {importProgress.current}/{importProgress.total}
              </span>
            )}
            <Button
              onClick={handleImportCurrentPage}
              disabled={isImportingPage || isCurrentPageImported}
              size="sm"
            >
              {isImportingPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : isCurrentPageImported ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  Imported
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import page {currentPage + 1} of {totalPages}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  async function handleImportCurrentPage() {
    const pageMappings = new Map<number, ArtistMapping[]>();
    const pageSetSelections = new Map<number, SetSelection>();

    pageSets.forEach((_set, localIndex) => {
      const originalIndex = pageStart + localIndex;
      const sels = artistSelections.get(originalIndex);
      if (sels) {
        pageMappings.set(
          localIndex,
          sels.map((s) => ({
            csvName: s.csvName,
            artistId: s.artistId,
            shouldCreate: s.isCreating,
          })),
        );
      }
      const sel = setSelections.get(originalIndex);
      if (sel) pageSetSelections.set(localIndex, sel);
    });

    setIsImportingPage(true);
    setImportProgress({ current: 0, total: pageSets.length });

    try {
      const result = await onImportPage(
        pageSets,
        pageMappings,
        pageSetSelections,
        (completed, total) => setImportProgress({ current: completed, total }),
      );

      const newPageResults = new Map(pageResults);
      newPageResults.set(currentPage, result);
      setPageResults(newPageResults);

      if (result.success) {
        setImportedPages((prev) => new Set([...prev, currentPage]));
        if (currentPage < totalPages - 1) {
          setCurrentPage((p) => p + 1);
        }
      }
    } finally {
      setIsImportingPage(false);
      setImportProgress({ current: 0, total: 0 });
    }
  }

  function handleArtistSelectionChange(
    setIndex: number,
    artistIndex: number,
    value: string,
  ) {
    const currentSelections = artistSelections.get(setIndex) || [];
    const newSelections = [...currentSelections];
    const selection = newSelections[artistIndex];

    if (value === "create") {
      newSelections[artistIndex] = {
        ...selection,
        artistId: null,
        isCreating: true,
      };
    } else {
      newSelections[artistIndex] = {
        ...selection,
        artistId: value,
        isCreating: false,
      };
    }

    const newMap = new Map(artistSelections);
    newMap.set(setIndex, newSelections);
    setArtistSelections(newMap);
  }

  function handleSetSelectionChange(setIndex: number, selection: SetSelection) {
    const newMap = new Map(setSelections);
    newMap.set(setIndex, selection);
    setSetSelections(newMap);
  }
}

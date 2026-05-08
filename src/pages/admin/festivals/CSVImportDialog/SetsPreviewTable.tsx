import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { SetImportData } from "@/services/csv/csvParser";
import { validateSetData } from "@/services/csv/timeValidator";
import { useState, useMemo } from "react";
import { useArtistsQuery } from "@/hooks/queries/artists/useArtists";
import { useMatchingSetsQuery } from "@/hooks/queries/sets/useMatchingSetsQuery";
import { SetPreviewRow } from "./SetPreviewRow";
import { PageImportControls } from "./PageImportControls";
import { useArtistSelections } from "./useArtistSelections";
import { useSetMatchSelections } from "./useSetMatchSelections";
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

  const totalPages = Math.ceil(sets.length / PAGE_SIZE);
  const pageStart = currentPage * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, sets.length);
  const pageSets = useMemo(
    () => sets.slice(pageStart, pageEnd),
    [sets, pageStart, pageEnd],
  );

  const artistsQuery = useArtistsQuery();
  const matchingSetsQuery = useMatchingSetsQuery(pageSets, editionId);

  const artistsByName = useMemo(() => {
    const map = new Map<string, string>();
    artistsQuery.data?.forEach((artist) =>
      map.set(artist.name.toLowerCase(), artist.id),
    );
    return map;
  }, [artistsQuery.data]);

  const { artistSelections, handleArtistSelectionChange } = useArtistSelections(
    {
      sets,
      artistsByName,
    },
  );

  const { setSelections, handleSetSelectionChange } = useSetMatchSelections({
    pageSets,
    pageStart,
    matchingSetsData: matchingSetsQuery.data,
  });

  if (sets.length === 0) return null;

  const pageValidationResults = pageSets.map((set, localIndex) =>
    validateSetData(set, pageStart + localIndex, timezone),
  );

  const totalValidCount = sets.filter(
    (set, i) => validateSetData(set, i, timezone).isValid,
  ).length;

  const hasSeparateDateFields = sets.some(
    (set) => set.date_start !== undefined || set.date_end !== undefined,
  );

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
            {sets.length - totalValidCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {sets.length - totalValidCount} invalid
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
                    matchingSets={matchingSetsQuery.data?.get(localIndex) || []}
                    setSelection={setSelections.get(originalIndex)}
                    artistSelections={artistSelections.get(originalIndex) || []}
                    isLoadingMatches={matchingSetsQuery.isLoading}
                    editionId={editionId}
                    onArtistSelectionChange={handleArtistSelectionChange}
                    onSetSelectionChange={handleSetSelectionChange}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>

        <PageImportControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageStart={pageStart}
          pageEnd={pageEnd}
          totalSets={sets.length}
          importedPages={importedPages}
          isImportingPage={isImportingPage}
          importProgress={importProgress}
          currentPageResult={pageResults.get(currentPage)}
          isCurrentPageImported={importedPages.has(currentPage)}
          onPageChange={setCurrentPage}
          onImport={handleImportCurrentPage}
        />
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

      setPageResults((prev) => new Map(prev).set(currentPage, result));

      if (result.success) {
        setImportedPages((prev) => new Set([...prev, currentPage]));
        if (currentPage < totalPages - 1) setCurrentPage((p) => p + 1);
      }
    } finally {
      setIsImportingPage(false);
      setImportProgress({ current: 0, total: 0 });
    }
  }
}

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
import {
  validateSetData,
  type SetValidationResult,
} from "@/services/csv/timeValidator";
import { useState, useEffect, useMemo } from "react";
import { useArtistsQuery } from "@/hooks/queries/artists/useArtists";
import { useMatchingSetsQuery } from "@/hooks/queries/sets/useMatchingSetsQuery";
import { SetPreviewRow } from "./SetPreviewRow";

export interface ArtistSelection {
  csvName: string;
  artistId: string | null;
  isCreating: boolean;
}

export interface SetSelection {
  action: "match" | "duplicate" | "create";
  matchedSetId?: string;
}

interface SetsPreviewTableProps {
  sets: SetImportData[];
  timezone: string;
  editionId: string;
  onArtistSelectionsChange?: (
    selections: Map<number, ArtistSelection[]>,
  ) => void;
  onSetSelectionsChange?: (selections: Map<number, SetSelection>) => void;
}

export function SetsPreviewTable({
  sets,
  timezone,
  editionId,
  onArtistSelectionsChange,
  onSetSelectionsChange,
}: SetsPreviewTableProps) {
  const [artistSelections, setArtistSelections] = useState<
    Map<number, ArtistSelection[]>
  >(new Map());
  const [setSelections, setSetSelections] = useState<Map<number, SetSelection>>(
    new Map(),
  );

  const artistsQuery = useArtistsQuery();
  const matchingSetsQuery = useMatchingSetsQuery(sets, editionId);

  const matchingSets = matchingSetsQuery.data || new Map();
  const isLoadingMatches = matchingSetsQuery.isLoading;

  const artistsByName = useMemo(() => {
    const map = new Map<string, string>();
    artistsQuery.data?.forEach((artist) => {
      map.set(artist.name.toLowerCase(), artist.id);
    });
    return map;
  }, [artistsQuery.data]);

  useEffect(() => {
    const initialArtistSelections = new Map<number, ArtistSelection[]>();

    sets.forEach((set, index) => {
      const artistNames = set.artist_names
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

      const selections: ArtistSelection[] = artistNames.map((csvName) => {
        const artistId = artistsByName.get(csvName.toLowerCase());

        return {
          csvName,
          artistId: artistId || null,
          isCreating: !artistId,
        };
      });

      initialArtistSelections.set(index, selections);
    });

    setArtistSelections(initialArtistSelections);
    onArtistSelectionsChange?.(initialArtistSelections);
  }, [sets, artistsByName, onArtistSelectionsChange]);

  useEffect(() => {
    const initialSetSelections = new Map<number, SetSelection>();

    sets.forEach((_set, index) => {
      if (!matchingSetsQuery.data) return;

      const matchingSetsForRow = matchingSetsQuery.data?.get(index) || [];
      if (matchingSetsForRow.length > 0) {
        initialSetSelections.set(index, {
          action: "match",
          matchedSetId: matchingSetsForRow[0].id,
        });
      } else {
        initialSetSelections.set(index, {
          action: "create",
        });
      }
    });

    setSetSelections(initialSetSelections);
    onSetSelectionsChange?.(initialSetSelections);
  }, [sets, matchingSetsQuery.data, onSetSelectionsChange]);

  if (sets.length === 0) {
    return null;
  }

  const validationResults: SetValidationResult[] = sets.map((set, index) =>
    validateSetData(set, index, timezone),
  );

  const validCount = validationResults.filter((r) => r.isValid).length;
  const invalidCount = validationResults.length - validCount;

  const hasSeparateDateFields = sets.some(
    (set) => set.date_start !== undefined || set.date_end !== undefined,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Preview: {sets.length} set{sets.length !== 1 ? "s" : ""} (timezone:{" "}
            {timezone})
          </CardTitle>
          <div className="flex gap-2">
            {validCount > 0 && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                {validCount} valid
              </Badge>
            )}
            {invalidCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {invalidCount} invalid
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
              {sets.map((set, index) => (
                <SetPreviewRow
                  key={index}
                  set={set}
                  index={index}
                  validation={validationResults[index]}
                  hasSeparateDateFields={hasSeparateDateFields}
                  matchingSets={matchingSets.get(index) || []}
                  setSelection={setSelections.get(index)}
                  artistSelections={artistSelections.get(index) || []}
                  isLoadingMatches={isLoadingMatches}
                  editionId={editionId}
                  onArtistSelectionChange={handleArtistSelectionChange}
                  onSetSelectionChange={handleSetSelectionChange}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

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
    onArtistSelectionsChange?.(newMap);
  }

  function handleSetSelectionChange(setIndex: number, selection: SetSelection) {
    const newMap = new Map(setSelections);
    newMap.set(setIndex, selection);
    setSetSelections(newMap);
    onSetSelectionsChange?.(newMap);
  }
}

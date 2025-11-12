import { TableCell, TableRow } from "@/components/ui/table";
import type { SetImportData } from "@/services/csv/csvParser";
import type { SetValidationResult } from "@/services/csv/timeValidator";
import { cn } from "@/lib/utils";
import type { MatchingSet } from "@/services/csv/setMatcher";
import type { ArtistSelection } from "./SetsPreviewTable";
import { ArtistSelectionCell } from "./ArtistSelectionCell";
import { StageCellWithValidation } from "./StageCellWithValidation";
import { TimeCellWithValidation } from "./TimeCellWithValidation";
import { MatchingSetCell } from "./MatchingSetCell";

interface SetPreviewRowProps {
  set: SetImportData;
  index: number;
  validation: SetValidationResult;
  hasSeparateDateFields: boolean;
  matchingSet: MatchingSet | null;
  artistSelections: ArtistSelection[];
  allArtists: Array<{ id: string; name: string }>;
  isLoadingMatches: boolean;
  onArtistSelectionChange: (
    setIndex: number,
    artistIndex: number,
    value: string,
  ) => void;
}

export function SetPreviewRow({
  set,
  index,
  validation,
  hasSeparateDateFields,
  matchingSet,
  artistSelections,
  allArtists,
  isLoadingMatches,
  onArtistSelectionChange,
}: SetPreviewRowProps) {
  const hasErrors = !validation.isValid;

  return (
    <TableRow className={cn(hasErrors && "bg-destructive/5")}>
      <TableCell className="font-mono text-sm text-muted-foreground">
        {index + 1}
      </TableCell>
      <StageCellWithValidation
        stageName={set.stage_name}
        error={validation.errors.stage_name}
      />
      <ArtistSelectionCell
        artistSelections={artistSelections}
        allArtists={allArtists}
        isLoadingMatches={isLoadingMatches}
        validationError={validation.errors.artist_names}
        onArtistSelectionChange={(artistIndex, value) =>
          onArtistSelectionChange(index, artistIndex, value)
        }
      />
      {hasSeparateDateFields ? (
        <>
          <TableCell className="font-mono text-sm">
            <div>{set.date_start || "-"}</div>
          </TableCell>
          <TimeCellWithValidation
            time={set.time_start}
            error={validation.errors.time_start}
          />
          <TableCell className="font-mono text-sm">
            <div>{set.date_end || "-"}</div>
          </TableCell>
          <TimeCellWithValidation
            time={set.time_end}
            error={validation.errors.time_end}
          />
        </>
      ) : (
        <>
          <TimeCellWithValidation
            time={set.time_start}
            error={validation.errors.time_start}
          />
          <TimeCellWithValidation
            time={set.time_end}
            error={validation.errors.time_end}
          />
        </>
      )}
      <TableCell>{set.name || "-"}</TableCell>
      <TableCell className="max-w-xs truncate">
        {set.description || "-"}
      </TableCell>
      <MatchingSetCell matchingSet={matchingSet} isLoading={isLoadingMatches} />
    </TableRow>
  );
}

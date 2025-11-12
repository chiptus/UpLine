import { TableCell, TableRow } from "@/components/ui/table";
import type { SetImportData } from "@/services/csv/csvParser";
import type { SetValidationResult } from "@/services/csv/timeValidator";
import { cn } from "@/lib/utils";
import type { MatchingSet } from "@/services/csv/setMatcher";
import type { ArtistSelection, SetSelection } from "./SetsPreviewTable";
import { ArtistSelectionCell } from "./ArtistSelectionCell";
import { StageCellWithValidation } from "./StageCellWithValidation";
import { TimeCellWithValidation } from "./TimeCellWithValidation";
import { SetSelectionCell } from "./SetSelectionCell";

interface SetPreviewRowProps {
  set: SetImportData;
  index: number;
  validation: SetValidationResult;
  hasSeparateDateFields: boolean;
  matchingSets: MatchingSet[];
  setSelection?: SetSelection;
  artistSelections: ArtistSelection[];
  isLoadingMatches: boolean;
  onArtistSelectionChange: (
    setIndex: number,
    artistIndex: number,
    value: string,
  ) => void;
  onSetSelectionChange: (setIndex: number, selection: SetSelection) => void;
}

export function SetPreviewRow({
  set,
  index,
  validation,
  hasSeparateDateFields,
  matchingSets,
  setSelection,
  artistSelections,
  isLoadingMatches,
  onArtistSelectionChange,
  onSetSelectionChange,
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
      <SetSelectionCell
        matchingSets={matchingSets}
        setSelection={setSelection}
        isLoading={isLoadingMatches}
        onSetSelectionChange={(selection) =>
          onSetSelectionChange(index, selection)
        }
      />
    </TableRow>
  );
}

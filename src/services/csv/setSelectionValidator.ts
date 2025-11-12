import type { SetSelection } from "@/pages/admin/festivals/CSVImportDialog/SetsPreviewTable";

export interface SetSelectionValidationError {
  rowIndices: number[];
  setId: string;
  message: string;
}

export function validateSetSelections(
  selections: Map<number, SetSelection>,
): SetSelectionValidationError[] {
  const errors: SetSelectionValidationError[] = [];
  const matchedSetIds = new Map<string, number[]>();

  selections.forEach((selection, rowIndex) => {
    if (selection.action === "match" && selection.matchedSetId) {
      const setId = selection.matchedSetId;
      if (!matchedSetIds.has(setId)) {
        matchedSetIds.set(setId, []);
      }
      matchedSetIds.get(setId)!.push(rowIndex);
    }
  });

  matchedSetIds.forEach((rowIndices, setId) => {
    if (rowIndices.length > 1) {
      errors.push({
        rowIndices,
        setId,
        message: `Set is matched by multiple rows (${rowIndices.map((i) => i + 1).join(", ")}). Only one row can match an existing set. Use "Duplicate" or "Create new" for the others.`,
      });
    }
  });

  return errors;
}

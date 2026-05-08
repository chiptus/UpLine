import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Upload,
} from "lucide-react";
import type { ImportResult } from "@/services/csv/types";

interface PageImportControlsProps {
  currentPage: number;
  totalPages: number;
  pageStart: number;
  pageEnd: number;
  totalSets: number;
  importedPages: Set<number>;
  isImportingPage: boolean;
  importProgress: { current: number; total: number };
  currentPageResult: ImportResult | undefined;
  isCurrentPageImported: boolean;
  onPageChange: (page: number) => void;
  onImport: () => void;
}

export function PageImportControls({
  currentPage,
  totalPages,
  pageStart,
  pageEnd,
  totalSets,
  importedPages,
  isImportingPage,
  importProgress,
  currentPageResult,
  isCurrentPageImported,
  onPageChange,
  onImport,
}: PageImportControlsProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0 || isImportingPage}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => !isImportingPage && onPageChange(i)}
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
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages - 1 || isImportingPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          Rows {pageStart + 1}–{pageEnd} of {totalSets}
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
          onClick={onImport}
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
  );
}

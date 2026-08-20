interface BulkEditorFooterProps {
  pageCount: number;
  totalCount: number;
  selectedCount: number;
}

export function BulkEditorFooter({
  pageCount,
  totalCount,
  selectedCount,
}: BulkEditorFooterProps) {
  if (pageCount === 0) return null;

  return (
    <div className="text-sm text-muted-foreground text-center">
      Showing {pageCount} of {totalCount} artists
      {selectedCount > 0 && (
        <span className="ml-2">• {selectedCount} selected</span>
      )}
    </div>
  );
}

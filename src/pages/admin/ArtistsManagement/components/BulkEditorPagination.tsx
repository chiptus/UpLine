import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface BulkEditorPaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function BulkEditorPagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
}: BulkEditorPaginationProps) {
  const pageCount = Math.ceil(totalCount / pageSize);
  if (pageCount <= 1) return null;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={page === 0}
            className={page === 0 ? "pointer-events-none opacity-50" : ""}
            onClick={(e) => {
              e.preventDefault();
              if (page > 0) onPageChange(page - 1);
            }}
          />
        </PaginationItem>
        <PaginationItem>
          <span className="text-sm text-muted-foreground px-2">
            Page {page + 1} of {pageCount}
          </span>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={page >= pageCount - 1}
            className={
              page >= pageCount - 1 ? "pointer-events-none opacity-50" : ""
            }
            onClick={(e) => {
              e.preventDefault();
              if (page < pageCount - 1) onPageChange(page + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

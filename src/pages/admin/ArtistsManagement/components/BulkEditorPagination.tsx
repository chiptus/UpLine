import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminArtistsPageSize } from "../searchSchema";

const PAGE_SIZE_OPTIONS: AdminArtistsPageSize[] = [10, 25, 50, 100];

interface BulkEditorPaginationProps {
  page: number;
  pageSize: AdminArtistsPageSize;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: AdminArtistsPageSize) => void;
}

export function BulkEditorPagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: BulkEditorPaginationProps) {
  const pageCount = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) =>
            onPageSizeChange(Number(value) as AdminArtistsPageSize)
          }
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {pageCount > 1 && (
        <Pagination className="mx-0 w-auto">
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
      )}
    </div>
  );
}

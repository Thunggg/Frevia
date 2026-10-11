import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";

const DEFAULT_COLUMNS = ["w-16", "w-32", "", "w-24", "w-28", "w-20"] as const;

type AdminTableSkeletonProps = {
  columns?: readonly string[];
  rows?: number;
};

export function AdminTableSkeleton({
  columns = DEFAULT_COLUMNS,
  rows = 8,
}: AdminTableSkeletonProps) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((width, index) => (
              <TableHead key={index} className={width || undefined}>
                <Skeleton className="h-4 w-16" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((width, colIndex) => (
                <TableCell key={colIndex} className="py-4">
                  <Skeleton
                    className={`h-5 ${width || "w-full"} ${
                      colIndex === columns.length - 1 ? "ml-auto w-8" : ""
                    }`}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdminDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-36" />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </div>
  );
}

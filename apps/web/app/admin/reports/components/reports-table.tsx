"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { adminApiRequest } from "@/apiRequests/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Separator } from "@repo/ui/components/shadcn/separator";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/shadcn/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { toastSuccess, toastError } from "@repo/ui/components/shadcn/toast";
import {
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { AdminPagination } from "../../components/admin-pagination";
import type { ForumReportListResponseType } from "@shared/types";
import { ReportStatus } from "@shared/types";

type ReportItem = ForumReportListResponseType["reports"][number];

interface ReportsTableProps {
  reports: ReportItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  currentStatus?: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  PENDING: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  REVIEWED: {
    label: "Reviewed",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Eye,
  },
  RESOLVED: {
    label: "Resolved",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  DISMISSED: {
    label: "Dismissed",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: XCircle,
  },
};

export function ReportsTable({
  reports,
  pagination,
  currentStatus,
}: ReportsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewingReport, setViewingReport] = useState<ReportItem | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleStatusChange = async (reportId: number, newStatus: string) => {
    setUpdatingId(reportId);
    try {
      await adminApiRequest.updateReportStatus(reportId, newStatus);
      toastSuccess({ message: "Report status updated" });
      router.refresh();
    } catch {
      toastError({ message: "Failed to update status" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const displayStatus = currentStatus || "all";

  return (
    <div className="space-y-4">
      <Tabs value={displayStatus} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {Object.entries(statusConfig).map(([key, config]) => (
            <TabsTrigger key={key} value={key}>
              {config.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead className="w-[200px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  No reports found.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => {
                const config = statusConfig[report.status];
                const StatusIcon = config?.icon ?? AlertTriangle;
                return (
                  <TableRow key={report.id} className="group">
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {report.id}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {report.reporter.profile?.displayName ??
                          `User #${report.reporterId}`}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {report.reason.length > 40
                        ? report.reason.slice(0, 40) + "..."
                        : report.reason}
                    </TableCell>
                    <TableCell className="text-sm">
                      {report.post?.title ?? `Comment #${report.commentId}`}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${config?.color} border`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setViewingReport(report)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Select
                          value={report.status}
                          onValueChange={(val) =>
                            handleStatusChange(report.id, val)
                          }
                          disabled={updatingId === report.id}
                        >
                          <SelectTrigger className="w-[110px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ReportStatus.PENDING}>
                              Pending
                            </SelectItem>
                            <SelectItem value={ReportStatus.REVIEWED}>
                              Reviewed
                            </SelectItem>
                            <SelectItem value={ReportStatus.RESOLVED}>
                              Resolved
                            </SelectItem>
                            <SelectItem value={ReportStatus.DISMISSED}>
                              Dismissed
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <AdminPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
        />
      )}

      <Dialog
        open={!!viewingReport}
        onOpenChange={(open) => !open && setViewingReport(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-8">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Report Detail
            </DialogTitle>
          </DialogHeader>
          {viewingReport && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    Reported by{" "}
                    {viewingReport.reporter.profile?.displayName ??
                      `User #${viewingReport.reporterId}`}
                  </span>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(
                      viewingReport.createdAt,
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`${statusConfig[viewingReport.status]?.color} border`}
                >
                  {statusConfig[viewingReport.status]?.label}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Reason
                </p>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {viewingReport.reason}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Reported Content
                </p>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {viewingReport.post?.title ??
                      viewingReport.comment?.content ??
                      "Content unavailable"}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Report ID: {viewingReport.id} · Post ID:{" "}
                  {viewingReport.postId ?? "N/A"}
                </p>

              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

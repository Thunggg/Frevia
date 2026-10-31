"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { adminApiRequest } from "@/apiRequests/admin";
import { formatDate } from "@/lib/format";
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
import { NumberedPagination } from "../../components/numbered-pagination";
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
  { color: string; icon: React.ElementType }
> = {
  PENDING: {
    color:
      "border-[#4fae2e]/30 bg-[#eaf8df] text-[#3f9225] dark:bg-[#4fae2e]/15 dark:text-[#5bc03a]",
    icon: Clock,
  },
  REVIEWED: {
    color: "border-border bg-muted text-muted-foreground",
    icon: Eye,
  },
  RESOLVED: {
    color:
      "border-[#4fae2e]/30 bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15",
    icon: CheckCircle,
  },
  DISMISSED: {
    color: "border-border bg-background text-muted-foreground",
    icon: XCircle,
  },
};

export function ReportsTable({
  reports,
  pagination,
  currentStatus,
}: ReportsTableProps) {
  const locale = useLocale();
  const t = useTranslations("adminReports");
  const tCommon = useTranslations("adminCommon");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewingReport, setViewingReport] = useState<ReportItem | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const statusLabel = (status: string) => {
    if (status === ReportStatus.PENDING) return t("statusPending");
    if (status === ReportStatus.REVIEWED) return t("statusReviewed");
    if (status === ReportStatus.RESOLVED) return t("statusResolved");
    return t("statusDismissed");
  };

  const handleStatusChange = async (reportId: number, newStatus: string) => {
    setUpdatingId(reportId);
    try {
      await adminApiRequest.updateReportStatus(reportId, newStatus);
      toastSuccess({ message: t("statusUpdatedToast") });
      router.refresh();
    } catch {
      toastError({ message: t("statusUpdateFailed") });
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
          <TabsTrigger value="all">{tCommon("all")}</TabsTrigger>
          <TabsTrigger value={ReportStatus.PENDING}>
            {t("statusPending")}
          </TabsTrigger>
          <TabsTrigger value={ReportStatus.REVIEWED}>
            {t("statusReviewed")}
          </TabsTrigger>
          <TabsTrigger value={ReportStatus.RESOLVED}>
            {t("statusResolved")}
          </TabsTrigger>
          <TabsTrigger value={ReportStatus.DISMISSED}>
            {t("statusDismissed")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">{tCommon("id")}</TableHead>
              <TableHead>{t("colReporter")}</TableHead>
              <TableHead>{t("colReason")}</TableHead>
              <TableHead>{t("colTarget")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
              <TableHead>{t("colReported")}</TableHead>
              <TableHead className="w-[200px] text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  {t("empty")}
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
                      {report.post?.title ??
                        t("commentTargetLabel", { id: report.commentId ?? "" })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${config?.color} border`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusLabel(report.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {formatDate(report.createdAt, locale)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setViewingReport(report)}
                          aria-label={t("viewReportLabel", { id: report.id })}
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
                              {t("statusPending")}
                            </SelectItem>
                            <SelectItem value={ReportStatus.REVIEWED}>
                              {t("statusReviewed")}
                            </SelectItem>
                            <SelectItem value={ReportStatus.RESOLVED}>
                              {t("statusResolved")}
                            </SelectItem>
                            <SelectItem value={ReportStatus.DISMISSED}>
                              {t("statusDismissed")}
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
        <NumberedPagination
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
              {t("detailTitle")}
            </DialogTitle>
          </DialogHeader>
          {viewingReport && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {t("reportedBy", {
                      name:
                        viewingReport.reporter.profile?.displayName ??
                        `User #${viewingReport.reporterId}`,
                    })}
                  </span>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(viewingReport.createdAt, locale)}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`${statusConfig[viewingReport.status]?.color} border`}
                >
                  {statusLabel(viewingReport.status)}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  {t("reasonHeading")}
                </p>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {viewingReport.reason}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  {t("contentHeading")}
                </p>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {viewingReport.post?.title ??
                      viewingReport.comment?.content ??
                      t("contentUnavailable")}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {t("idsLabel", {
                    reportId: viewingReport.id,
                    postId: viewingReport.postId ?? tCommon("notAvailable"),
                  })}
                </p>

              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

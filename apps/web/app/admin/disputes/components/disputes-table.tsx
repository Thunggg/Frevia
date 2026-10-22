"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/shadcn/tabs";
import { Eye, Gavel, Scale } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { NumberedPagination } from "../../components/numbered-pagination";
import { ArbitrateDialog } from "./arbitrate-dialog";
import type { DisputeDetailType } from "@shared/types";

interface DisputesTableProps {
  disputes: DisputeDetailType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  currentStatus?: string;
}

const statusClassName: Record<string, string> = {
  OPEN: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  WAITING_RESPONSE:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  UNDER_REVIEW:
    "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  DECISION_MADE:
    "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  REVIEW_REQUESTED:
    "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
  FINALIZED:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
};

const DEFAULT_STATUS_CLASS =
  "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30";

export function DisputesTable({
  disputes,
  pagination,
  currentStatus,
}: DisputesTableProps) {
  const locale = useLocale();
  const t = useTranslations("adminDisputes");
  const tCommon = useTranslations("adminCommon");
  const router = useRouter();
  const [selectedDispute, setSelectedDispute] = useState<DisputeDetailType | null>(null);
  const [arbitrateOpen, setArbitrateOpen] = useState(false);

  const statusLabel = (status: string) => {
    if (status === "OPEN") return t("statusOpenFeePending");
    if (status === "WAITING_RESPONSE") return t("statusWaitingRebuttal");
    if (status === "UNDER_REVIEW") return t("statusUnderReview");
    if (status === "DECISION_MADE") return t("statusDecisionProposed");
    if (status === "REVIEW_REQUESTED") return t("statusReviewRequested");
    if (status === "FINALIZED") return t("statusFinalized");
    return status;
  };

  const money = (amount: number | string | null | undefined) =>
    formatCurrency(amount, locale, "USD", 0);

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams();
    if (status !== "ALL") {
      params.set("status", status);
    }
    params.set("page", "1");
    router.push(`/admin/disputes?${params.toString()}`);
  };

  const handleRowClick = (dispute: DisputeDetailType) => {
    setSelectedDispute(dispute);
    setArbitrateOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Status Filter Tabs */}
      <Tabs
        value={currentStatus || "ALL"}
        onValueChange={handleStatusChange}
        className="w-full"
      >
        <TabsList className="flex flex-wrap h-auto p-1 gap-1">
          <TabsTrigger value="ALL" className="text-xs">
            {t("tabAll", { count: pagination.total })}
          </TabsTrigger>
          <TabsTrigger value="OPEN" className="text-xs">
            {t("tabOpen")}
          </TabsTrigger>
          <TabsTrigger value="WAITING_RESPONSE" className="text-xs">
            {t("tabWaitingResponse")}
          </TabsTrigger>
          <TabsTrigger value="UNDER_REVIEW" className="text-xs">
            {t("tabUnderReview")}
          </TabsTrigger>
          <TabsTrigger value="DECISION_MADE" className="text-xs">
            {t("tabDecisionMade")}
          </TabsTrigger>
          <TabsTrigger value="REVIEW_REQUESTED" className="text-xs">
            {t("tabReviewRequested")}
          </TabsTrigger>
          <TabsTrigger value="FINALIZED" className="text-xs">
            {t("tabFinalized")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Disputes Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-16 font-bold text-xs">{tCommon("id")}</TableHead>
              <TableHead className="font-bold text-xs">
                {t("colMilestoneValue")}
              </TableHead>
              <TableHead className="font-bold text-xs">{t("colParties")}</TableHead>
              <TableHead className="font-bold text-xs">{tCommon("status")}</TableHead>
              <TableHead className="font-bold text-xs">{t("colFees")}</TableHead>
              <TableHead className="font-bold text-xs">{t("colFiledOn")}</TableHead>
              <TableHead className="text-right font-bold text-xs">{t("colAction")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {disputes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-36 text-center text-xs text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Scale className="size-6 text-muted-foreground/40" />
                    <span>{t("empty")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              disputes.map((dispute) => {
                const paidFees = dispute.fees?.filter((f) => f.status === "PAID").length ?? 0;
                const totalFees = dispute.fees?.length ?? 2;

                return (
                  <TableRow
                    key={dispute.id}
                    onClick={() => handleRowClick(dispute)}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="font-bold text-xs text-muted-foreground">
                      #{dispute.id}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 max-w-xs truncate">
                        <span className="font-bold text-xs text-foreground block truncate">
                          {dispute.milestone?.title ??
                            t("milestoneFallback", { id: dispute.milestoneId })}
                        </span>
                        <span className="text-[11px] font-extrabold text-[#0069D3]">
                          {money(dispute.milestone?.amount)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5 max-w-[200px] truncate">
                        <div className="truncate text-muted-foreground text-[11px]">
                          {t("claimantLabel")}{" "}
                          <span className="font-semibold text-foreground">
                            {dispute.openedBy?.email ?? tCommon("notAvailable")}
                          </span>
                        </div>
                        <div className="truncate text-muted-foreground text-[11px]">
                          {t("respondentLabel")}{" "}
                          <span className="font-semibold text-foreground">
                            {dispute.respondent?.email ?? tCommon("notAvailable")}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-semibold ${
                          statusClassName[dispute.status] ?? DEFAULT_STATUS_CLASS
                        }`}
                      >
                        {statusLabel(dispute.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-semibold ${
                          paidFees === totalFees
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {t("feesPaidCount", { paid: paidFees, total: totalFees })}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(dispute.createdAt, locale)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRowClick(dispute)}
                        className="rounded-full text-xs h-7 px-3 border-border hover:bg-[#0069D3] hover:text-white transition-colors"
                      >
                        {dispute.status === "FINALIZED" ? (
                          <>
                            <Eye className="mr-1 size-3" />
                            {t("actionView")}
                          </>
                        ) : (
                          <>
                            <Gavel className="mr-1 size-3 text-[#0069D3] group-hover:text-white" />
                            {t("actionArbitrate")}
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <NumberedPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
        />
      )}

      {/* Arbitrate / Review Dialog */}
      <ArbitrateDialog
        dispute={selectedDispute}
        open={arbitrateOpen}
        onOpenChange={setArbitrateOpen}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}

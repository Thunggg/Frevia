"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

function money(amount: number | string | null | undefined) {
  if (amount === null || amount === undefined) return "$0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(isNaN(num) ? 0 : num);
}

function formatDate(date: string | Date | null | undefined) {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getStatusBadge(status: string) {
  switch (status) {
    case "OPEN":
      return {
        label: "Open • Fee Pending",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      };
    case "WAITING_RESPONSE":
      return {
        label: "Waiting Rebuttal",
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      };
    case "UNDER_REVIEW":
      return {
        label: "Under Review",
        className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      };
    case "DECISION_MADE":
      return {
        label: "Decision Proposed",
        className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      };
    case "REVIEW_REQUESTED":
      return {
        label: "Review Requested",
        className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
      };
    case "FINALIZED":
      return {
        label: "Finalized",
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      };
    default:
      return {
        label: status,
        className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
      };
  }
}

export function DisputesTable({
  disputes,
  pagination,
  currentStatus,
}: DisputesTableProps) {
  const router = useRouter();
  const [selectedDispute, setSelectedDispute] = useState<DisputeDetailType | null>(null);
  const [arbitrateOpen, setArbitrateOpen] = useState(false);

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
            All ({pagination.total})
          </TabsTrigger>
          <TabsTrigger value="OPEN" className="text-xs">
            Open
          </TabsTrigger>
          <TabsTrigger value="WAITING_RESPONSE" className="text-xs">
            Waiting Rebuttal
          </TabsTrigger>
          <TabsTrigger value="UNDER_REVIEW" className="text-xs">
            Under Review
          </TabsTrigger>
          <TabsTrigger value="DECISION_MADE" className="text-xs">
            Decision Made
          </TabsTrigger>
          <TabsTrigger value="REVIEW_REQUESTED" className="text-xs">
            Review Requested
          </TabsTrigger>
          <TabsTrigger value="FINALIZED" className="text-xs">
            Finalized
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Disputes Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-16 font-bold text-xs">ID</TableHead>
              <TableHead className="font-bold text-xs">Milestone & Value</TableHead>
              <TableHead className="font-bold text-xs">Parties</TableHead>
              <TableHead className="font-bold text-xs">Status</TableHead>
              <TableHead className="font-bold text-xs">Fees</TableHead>
              <TableHead className="font-bold text-xs">Filed On</TableHead>
              <TableHead className="text-right font-bold text-xs">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {disputes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-36 text-center text-xs text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Scale className="size-6 text-muted-foreground/40" />
                    <span>No dispute cases found.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              disputes.map((dispute) => {
                const badge = getStatusBadge(dispute.status);
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
                          {dispute.milestone?.title ?? `Milestone #${dispute.milestoneId}`}
                        </span>
                        <span className="text-[11px] font-extrabold text-[#0069D3]">
                          {money(dispute.milestone?.amount)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5 max-w-[200px] truncate">
                        <div className="truncate text-muted-foreground text-[11px]">
                          Claimant:{" "}
                          <span className="font-semibold text-foreground">
                            {dispute.openedBy?.email ?? "N/A"}
                          </span>
                        </div>
                        <div className="truncate text-muted-foreground text-[11px]">
                          Respondent:{" "}
                          <span className="font-semibold text-foreground">
                            {dispute.respondent?.email ?? "N/A"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[11px] font-semibold ${badge.className}`}>
                        {badge.label}
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
                        {paidFees}/{totalFees} Paid
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(dispute.createdAt)}
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
                            View
                          </>
                        ) : (
                          <>
                            <Gavel className="mr-1 size-3 text-[#0069D3] group-hover:text-white" />
                            Arbitrate
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

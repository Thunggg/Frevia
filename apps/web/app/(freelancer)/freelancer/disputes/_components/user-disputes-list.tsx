"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/shadcn/tabs";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import {
  CalendarDays,
  ExternalLink,
  Gavel,
  Loader2,
} from "@/components/icons";
import { disputeApiRequest } from "@/apiRequests/dispute";
import {
  DISPUTE_STATUS_KEYS,
  getDisputeStatusBadgeClass,
} from "@/lib/dispute-status";
import { DisputeDialog } from "@/app/(client)/client/contracts/[contractId]/_components/dispute-dialog";
import type { DisputeDetailType, MilestoneType } from "@shared/types";

interface UserDisputesListProps {
  isFreelancer: boolean;
}

export function UserDisputesList({ isFreelancer }: UserDisputesListProps) {
  const t = useTranslations("disputes");
  const tStatus = useTranslations("disputeStatus");
  const tRole = useTranslations("roleName");
  const format = useFormatter();

  const money = (amount: number | string | null | undefined) => {
    const parsed =
      amount === null || amount === undefined
        ? 0
        : typeof amount === "string"
          ? parseFloat(amount)
          : amount;

    return format.number(Number.isNaN(parsed) ? 0 : parsed, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (date: string | Date | null | undefined) =>
    date
      ? format.dateTime(new Date(date), {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : t("notAvailable");

  const statusText = (status: string) =>
    (DISPUTE_STATUS_KEYS as readonly string[]).includes(status)
      ? tStatus(status)
      : status;

  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [activeDispute, setActiveDispute] = useState<DisputeDetailType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["my-disputes", selectedStatus],
    queryFn: async () => {
      const res = await disputeApiRequest.getMyDisputes({
        limit: 50,
        status: selectedStatus === "ALL" ? undefined : selectedStatus,
      });
      return res.data;
    },
  });

  const disputes = data?.data ?? [];

  const handleOpenDispute = (dispute: DisputeDetailType) => {
    setActiveDispute(dispute);
    setDialogOpen(true);
  };

  // Construct milestone object for DisputeDialog
  const activeMilestone: MilestoneType | null = activeDispute?.milestone
    ? ({
        id: activeDispute.milestone.id,
        contractId: activeDispute.milestone.contractId,
        title: activeDispute.milestone.title,
        amount: activeDispute.milestone.amount,
        status: activeDispute.milestone.status as MilestoneType["status"],
        paymentStatus: activeDispute.milestone
          .paymentStatus as MilestoneType["paymentStatus"],
        description: null,
        dueDate: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as MilestoneType)
    : null;

  return (
    <div className="space-y-6">
      {/* Status Filter Tabs */}
      <Tabs
        value={selectedStatus}
        onValueChange={setSelectedStatus}
        className="w-full"
      >
        <TabsList className="flex flex-wrap h-auto p-1 gap-1">
          <TabsTrigger value="ALL" className="text-xs">
            {t("tabAll")}
          </TabsTrigger>
          <TabsTrigger value="OPEN" className="text-xs">
            {t("tabFeePending")}
          </TabsTrigger>
          <TabsTrigger value="WAITING_RESPONSE" className="text-xs">
            {t("tabAwaiting")}
          </TabsTrigger>
          <TabsTrigger value="UNDER_REVIEW" className="text-xs">
            {t("tabUnderReview")}
          </TabsTrigger>
          <TabsTrigger value="DECISION_MADE" className="text-xs">
            {t("tabDecision")}
          </TabsTrigger>
          <TabsTrigger value="FINALIZED" className="text-xs">
            {t("tabFinalized")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Disputes List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <Loader2 className="size-8 text-[#0069D3] animate-spin" />
          <span className="text-xs text-muted-foreground">
            {t("loading")}
          </span>
        </div>
      ) : disputes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Gavel className="size-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">
            {t("emptyTitle")}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {selectedStatus === "ALL"
              ? t("emptyAll")
              : t("emptyFiltered", { status: statusText(selectedStatus) })}
          </p>
          <Button asChild size="sm" className="mt-4 rounded-full text-xs bg-[#0069D3] text-white">
            <Link href={isFreelancer ? "/freelancer/contracts" : "/client/contracts"}>
              {t("viewContracts")}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {disputes.map((dispute) => {
            const badgeClass = getDisputeStatusBadgeClass(dispute.status);
            const counterpartyEmail = isFreelancer
              ? dispute.openedBy?.email ?? tRole("CLIENT")
              : dispute.respondent?.email ?? tRole("FREELANCER");

            const contractHref = isFreelancer
              ? `/freelancer/contracts/${dispute.milestone?.contractId}`
              : `/client/contracts/${dispute.milestone?.contractId}`;

            return (
              <div
                key={dispute.id}
                onClick={() => handleOpenDispute(dispute)}
                className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:border-[#0069D3]/40 hover:shadow-md sm:flex-row sm:items-center cursor-pointer"
              >
                {/* Left Information */}
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-muted-foreground">
                      {t("caseNumber", { id: dispute.id })}
                    </span>
                    <Badge variant="outline" className={`text-[11px] font-semibold ${badgeClass}`}>
                      {statusText(dispute.status)}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-foreground truncate">
                      {dispute.milestone?.title ??
                        t("milestoneFallback", { id: dispute.milestoneId })}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {t.rich("reasonPrefix", {
                        reason: dispute.reason,
                        strong: (chunks) => (
                          <span className="text-foreground/90 font-medium">
                            {chunks}
                          </span>
                        ),
                      })}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span>
                      {t.rich("counterparty", {
                        name: counterpartyEmail,
                        strong: (chunks) => (
                          <strong className="text-foreground">{chunks}</strong>
                        ),
                      })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3" />{" "}
                      {t("filedAt", { date: formatDate(dispute.createdAt) })}
                    </span>
                  </div>
                </div>

                {/* Right Value & Actions */}
                <div
                  className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/60"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-muted-foreground block">
                      {t("milestoneAmount")}
                    </span>
                    <span className="text-base font-extrabold text-foreground">
                      {money(dispute.milestone?.amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-xs h-8 px-3 text-muted-foreground hover:text-foreground"
                    >
                      <Link href={contractHref}>
                        {t("contractAction")}{" "}
                        <ExternalLink className="ml-1 size-3" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenDispute(dispute)}
                      className="rounded-full text-xs h-8 px-3.5 bg-[#0069D3] hover:bg-[#005bb8] text-white font-semibold"
                    >
                      <Gavel className="mr-1.5 size-3.5" />
                      {t("manageAction")}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dispute Dialog */}
      {activeDispute && activeMilestone && (
        <DisputeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          contractId={activeDispute.milestone?.contractId ?? 0}
          milestone={activeMilestone}
          currentUserId={isFreelancer ? activeDispute.respondentId : activeDispute.openedById}
          isFreelancer={isFreelancer}
          mode="VIEW"
          onSuccess={() => {
            void refetch();
          }}
        />
      )}
    </div>
  );
}

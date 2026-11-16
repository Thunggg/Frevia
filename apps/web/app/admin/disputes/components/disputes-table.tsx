"use client";

import { formatDateTime } from "@/lib/format";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import type { DisputeDetailType } from "@shared/types";
import { DisputeStatusEnum } from "@shared/types";
import { Eye, Gavel, Scale } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useActionPermission } from "@/hooks/use-action-permission";
import { DisputeDetailDialog } from "./dispute-detail-dialog";

export function DisputesTable({
  disputes,
}: {
  disputes: DisputeDetailType[];
}) {
  const t = useTranslations("adminDisputes");
  const locale = useLocale();
  const { can } = useActionPermission();
  const [selectedDispute, setSelectedDispute] =
    useState<DisputeDetailType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDetail = (dispute: DisputeDetailType) => {
    setSelectedDispute(dispute);
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case DisputeStatusEnum.enum.OPEN:
        return (
          <Badge
            variant="outline"
            className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
          >
            {t("statusOpenFeePending")}
          </Badge>
        );
      case DisputeStatusEnum.enum.WAITING_RESPONSE:
        return (
          <Badge
            variant="outline"
            className="border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400"
          >
            {t("statusWaitingRebuttal")}
          </Badge>
        );
      case DisputeStatusEnum.enum.UNDER_REVIEW:
        return (
          <Badge
            variant="outline"
            className="border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-400"
          >
            {t("statusUnderReview")}
          </Badge>
        );
      case DisputeStatusEnum.enum.DECISION_MADE:
        return (
          <Badge
            variant="outline"
            className="border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-400"
          >
            {t("statusDecisionProposed")}
          </Badge>
        );
      case DisputeStatusEnum.enum.REVIEW_REQUESTED:
        return (
          <Badge
            variant="outline"
            className="border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400"
          >
            {t("statusReviewRequested")}
          </Badge>
        );
      case DisputeStatusEnum.enum.FINALIZED:
        return (
          <Badge
            variant="outline"
            className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
          >
            {t("statusFinalized")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!disputes || disputes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <Scale className="size-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-base font-semibold text-foreground">
          {t("empty")}
        </h3>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">#ID</TableHead>
              <TableHead>{t("colMilestoneValue")}</TableHead>
              <TableHead>{t("colParties")}</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>{t("colFiledOn")}</TableHead>
              <TableHead className="text-right">{t("colAction")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {disputes.map((dispute) => {
              const milestoneAmount = dispute.milestone?.amount
                ? `$${Number(dispute.milestone.amount)}`
                : "-";
              const canViewDetail = can(
                "GET",
                `/api/admin/disputes/${dispute.id}`,
              );
              const canDecision = can(
                "POST",
                `/api/admin/disputes/${dispute.id}/decision`,
              );
              const canFinalDecision = can(
                "POST",
                `/api/admin/disputes/${dispute.id}/final-decision`,
              );

              const canArbitrateThis =
                (canDecision &&
                  (dispute.status === DisputeStatusEnum.enum.OPEN ||
                    dispute.status ===
                      DisputeStatusEnum.enum.WAITING_RESPONSE ||
                    dispute.status ===
                      DisputeStatusEnum.enum.UNDER_REVIEW)) ||
                (canFinalDecision &&
                  (dispute.status ===
                    DisputeStatusEnum.enum.REVIEW_REQUESTED ||
                    dispute.status === DisputeStatusEnum.enum.DECISION_MADE));

              const hasAnyAction = canViewDetail;

              return (
                <TableRow key={dispute.id} className="hover:bg-muted/40">
                  <TableCell className="font-mono text-xs font-semibold">
                    #{dispute.id}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">
                      {dispute.milestone?.title ??
                        t("milestoneFallback", { id: dispute.id })}
                    </p>
                    <p className="text-xs font-bold text-[#4fae2e]">
                      {milestoneAmount}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs">
                    <p>
                      <span className="text-muted-foreground">
                        {t("claimantLabel")}
                      </span>{" "}
                      <span className="font-medium">
                        {dispute.openedBy?.email ?? dispute.openedById}
                      </span>
                    </p>
                    <p className="mt-0.5">
                      <span className="text-muted-foreground">
                        {t("respondentLabel")}
                      </span>{" "}
                      <span className="font-medium">
                        {dispute.respondent?.email ?? dispute.respondentId}
                      </span>
                    </p>
                  </TableCell>
                  <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {dispute.createdAt
                      ? formatDateTime(dispute.createdAt, locale)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {!hasAnyAction ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <Button
                        size="sm"
                        variant={canArbitrateThis ? "default" : "outline"}
                        onClick={() => handleOpenDetail(dispute)}
                        className={
                          canArbitrateThis
                            ? "bg-[#4fae2e] text-white hover:bg-[#439626]"
                            : ""
                        }
                      >
                        {canArbitrateThis ? (
                          <>
                            <Gavel className="mr-1.5 size-3.5" />
                            {t("actionArbitrate")}
                          </>
                        ) : (
                          <>
                            <Eye className="mr-1.5 size-3.5" />
                            {t("actionView")}
                          </>
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <DisputeDetailDialog
        dispute={selectedDispute}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}

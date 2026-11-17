"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  Layers,
  Plus,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { contractApiRequest, extractContractData } from "@/apiRequests/contract";
import { paymentApiRequest } from "@/apiRequests/payment";
import { useActionPermission } from "@/hooks/use-action-permission";
import { ApiFail } from "@/lib/http";
import type {
  ContractDetailType,
  GetSubmissionResponseType,
  MilestoneType,
  SharedFileType,
} from "@shared/types";
import {
  ManageMilestoneDialog,
  type MilestoneItemData,
} from "@/app/(client)/client/contracts/[slug]/_components/manage-milestone-dialog";
import { MilestoneCard } from "./milestone-card";
import { SubmitMilestoneDialog } from "./submit-milestone-dialog";
import { ReviewSubmissionDialog } from "./review-submission-dialog";
import { FundMilestoneDialog } from "./fund-milestone-dialog";

export interface MilestonesPageContentProps {
  initialContract: ContractDetailType;
  initialSharedFiles?: SharedFileType[] | null;
  basePath?: string;
}

export function MilestonesPageContent({
  initialContract,
  basePath = "/client",
}: MilestonesPageContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = useActionPermission();
  const isFreelancer = basePath === "/freelancer";
  const isClient = !isFreelancer;

  const canViewMilestones = can("GET", "/api/contracts/:contractId/milestones");
  const canCreateMilestone = can("POST", "/api/contracts/:contractId/milestones");

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [milestoneToEdit, setMilestoneToEdit] =
    useState<MilestoneItemData | null>(null);

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [milestoneToSubmit, setMilestoneToSubmit] =
    useState<MilestoneType | null>(null);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewContext, setReviewContext] = useState<{
    milestone: MilestoneType;
    submission: GetSubmissionResponseType;
  } | null>(null);

  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [milestoneToFund, setMilestoneToFund] =
    useState<MilestoneType | null>(null);

  // Contract Query
  const { data: contract } = useQuery<ContractDetailType>({
    queryKey: ["client-contract-detail", initialContract.id],
    queryFn: () =>
      contractApiRequest
        .getContractDetail(initialContract.id)
        .then(extractContractData),
    initialData: initialContract,
  });

  const canManageMilestones =
    isClient &&
    (contract.status === "PENDING_SIGN" ||
      contract.status === "AWAITING_PAYMENT");

  const milestones: MilestoneType[] = useMemo(() => {
    return (contract.milestones || []) as MilestoneType[];
  }, [contract.milestones]);

  // Financial metrics
  const totalAmount = Number(contract.totalAmount) || 0;

  const currentAllocatedAmount = useMemo(() => {
    return milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  }, [milestones]);

  const completedMilestones = useMemo(() => {
    return milestones.filter((m) => m.status === "COMPLETED");
  }, [milestones]);

  const completedAmount = useMemo(() => {
    return completedMilestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  }, [completedMilestones]);

  const fundedAmount = useMemo(() => {
    return milestones
      .filter((m) => m.paymentStatus === "FUNDED" || m.paymentStatus === "RELEASED")
      .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  }, [milestones]);

  const progressPercent = useMemo(() => {
    if (milestones.length === 0) return 0;
    return Math.round((completedMilestones.length / milestones.length) * 100);
  }, [completedMilestones.length, milestones.length]);

  const hasInProgressMilestone = useMemo(() => {
    return milestones.some((m) => m.status === "IN_PROGRESS");
  }, [milestones]);

  // Filtered Milestones with search & status
  const filteredMilestones = useMemo(() => {
    let list = milestones;
    if (statusFilter !== "ALL") {
      if (statusFilter === "IN_PROGRESS") {
        list = list.filter((m) => m.status === "IN_PROGRESS");
      } else if (statusFilter === "SUBMITTED") {
        list = list.filter(
          (m) => m.status === "SUBMITTED" || m.status === "CHANGES_REQUESTED",
        );
      } else if (statusFilter === "PENDING_ESCROW") {
        list = list.filter((m) => m.paymentStatus === "PENDING");
      } else if (statusFilter === "LATE") {
        list = list.filter((m) => m.status === "LATE");
      } else if (statusFilter === "COMPLETED") {
        list = list.filter((m) => m.status === "COMPLETED");
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          `mls-${m.id}`.includes(q),
      );
    }
    return list;
  }, [milestones, statusFilter, searchQuery]);

  // Milestone Actions
  const handleStartWork = async (milestone: MilestoneType) => {
    try {
      await contractApiRequest.progressMilestone(contract.id, milestone.id);
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contract.id],
      });
      toastSuccess({
        message: `Started work on milestone "${milestone.title}"!`,
      });
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to start milestone.",
      });
    }
  };

  const handleReleaseMilestone = async (milestone: MilestoneType) => {
    try {
      await paymentApiRequest.releaseMilestone(contract.id, milestone.id);
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-transactions"],
      });
      toastSuccess({
        message: `Payout transferred via Stripe for milestone "${milestone.title}" (5% freelancer fee deducted).`,
      });
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to release milestone payout.",
      });
    }
  };

  const handleRefundMilestone = async (milestone: MilestoneType) => {
    if (
      !window.confirm(
        `Request automatic refund of $${Number(milestone.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} for "${milestone.title}" to your original payment card?`,
      )
    ) {
      return;
    }
    try {
      await paymentApiRequest.refundMilestone(contract.id, milestone.id);
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-transactions"],
      });
      toastSuccess({
        message: `Escrow funds refunded to your card for milestone "${milestone.title}".`,
      });
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to refund milestone escrow.",
      });
    }
  };

  const handleDeleteMilestone = async (milestone: MilestoneType) => {
    if (
      !window.confirm(
        `Are you sure you want to delete milestone "${milestone.title}"?`,
      )
    ) {
      return;
    }
    try {
      await contractApiRequest.deleteMilestone(contract.id, milestone.id);
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contract.id],
      });
      toastSuccess({ message: `Milestone "${milestone.title}" removed.` });
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to delete milestone.",
      });
    }
  };

  const contractCode =
    contract.slug?.startsWith("CTR-") || contract.slug?.startsWith("CON-")
      ? `#${contract.slug}`
      : `#CON-${contract.id}`;

  const counterparty = isFreelancer ? contract.client : contract.freelancer;
  const counterpartyName =
    counterparty?.profile?.displayName ||
    counterparty?.email?.split("@")[0] ||
    (isFreelancer ? "Client" : "Freelancer");
  const counterpartyRole = isFreelancer ? "Client" : "Freelancer";

  // Filter tabs for Fiverr-style pill bar
  const filterTabs = [
    { key: "ALL", label: "All", count: milestones.length },
    {
      key: "IN_PROGRESS",
      label: "In Progress",
      count: milestones.filter((m) => m.status === "IN_PROGRESS").length,
    },
    {
      key: "SUBMITTED",
      label: "Delivered / Review",
      count: milestones.filter(
        (m) => m.status === "SUBMITTED" || m.status === "CHANGES_REQUESTED",
      ).length,
    },
    {
      key: "COMPLETED",
      label: "Completed",
      count: completedMilestones.length,
    },
    {
      key: "PENDING_ESCROW",
      label: "Awaiting Escrow",
      count: milestones.filter((m) => m.paymentStatus === "PENDING").length,
    },
    {
      key: "LATE",
      label: "Overdue",
      count: milestones.filter((m) => m.status === "LATE").length,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 font-sans max-w-6xl mx-auto pb-16">
      {/* ── 1. Top Breadcrumb ── */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href={`${basePath}/contracts`}
          className="inline-flex items-center gap-1 font-medium hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          <span>Contracts</span>
        </Link>
        <span>/</span>
        <Link
          href={`${basePath}/contracts/${encodeURIComponent(contract.slug || String(contract.id))}`}
          className="font-medium hover:text-foreground transition-colors"
        >
          {contract.slug || contractCode}
        </Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Milestones</span>
      </div>

      {/* ── 2. Fiverr-Style Contract Header & Journey Summary (Borderless & Minimalist) ── */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {contract.job?.title || "Contract Milestones & Deliverables"}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
              <span className="font-mono font-medium">{contractCode}</span>
              <span>•</span>
              <div className="inline-flex items-center gap-1.5">
                <div className="flex size-4 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <User className="size-2.5" />
                </div>
                <span>
                  {counterpartyRole}: <strong>{counterpartyName}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action button if client can add milestone */}
          {canManageMilestones && canCreateMilestone && (
            <Button
              onClick={() => {
                setMilestoneToEdit(null);
                setMilestoneModalOpen(true);
              }}
              className="rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold h-9 px-4 shadow-2xs cursor-pointer self-start lg:self-auto"
            >
              <Plus className="mr-1.5 size-4" />
              Add New Milestone
            </Button>
          )}
        </div>

        {/* Minimalist Progress & Financial Summary Bar */}
        <div className="pt-2 pb-1 space-y-3">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">
                Progress:{" "}
                <strong className="text-foreground">
                  {completedMilestones.length} of {milestones.length} completed ({progressPercent}%)
                </strong>
              </span>
              <span className="font-mono font-semibold text-foreground">
                ${completedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} / $
                {totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Quick metric highlights (No heavy boxes, just clean horizontal badges) */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-8 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span className="text-muted-foreground">
                Secured in Escrow:{" "}
                <strong className="font-mono text-foreground font-semibold">
                  ${fundedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-blue-600" />
              <span className="text-muted-foreground">
                Paid Out:{" "}
                <strong className="font-mono text-foreground font-semibold">
                  ${completedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-zinc-400" />
              <span className="text-muted-foreground">
                Total Contract Budget:{" "}
                <strong className="font-mono text-foreground font-semibold">
                  ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Fiverr-Style Filter Tabs & Search Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border/50">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800/80 text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`rounded-full px-1.5 text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                        : "bg-zinc-200/60 dark:bg-zinc-700/60 text-muted-foreground"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Minimal Search Input */}
        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search milestones..."
            className="w-full h-8 rounded-full border border-border/60 bg-muted/20 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-hidden focus:border-[#0069D3] focus:bg-background transition-all"
          />
        </div>
      </div>

      {/* ── 4. Milestones Journey List (No nested boxed cards!) ── */}
      {!canViewMilestones ? (
        <div className="py-12 text-center space-y-2">
          <Clock className="size-8 mx-auto text-amber-600" />
          <h3 className="text-sm font-semibold text-foreground">
            Không có quyền xem danh sách milestone
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Tài khoản của bạn chưa được cấp quyền xem danh sách các mốc công việc (milestones) của hợp đồng này.
          </p>
        </div>
      ) : filteredMilestones.length > 0 ? (
        <div className="divide-y divide-border/40 border-t border-border/40">
          {filteredMilestones.map((m, idx) => (
            <MilestoneCard
              key={m.id}
              contractId={contract.id}
              contractSlug={encodeURIComponent(
                contract.slug || String(contract.id),
              )}
              contractStatus={contract.status}
              isHeldInContract={Boolean(
                contract.holdMilestoneIds?.includes(m.id),
              )}
              basePath={basePath}
              milestone={m}
              index={idx}
              totalMilestones={filteredMilestones.length}
              isFreelancer={isFreelancer}
              hasOtherInProgressMilestone={hasInProgressMilestone}
              onEdit={(target) => {
                setMilestoneToEdit({
                  id: target.id,
                  title: target.title,
                  description: target.description,
                  amount: Number(target.amount),
                  dueDate: target.dueDate,
                  status: target.status,
                });
                setMilestoneModalOpen(true);
              }}
              onDelete={(target) => void handleDeleteMilestone(target)}
              onFund={(target) => {
                setMilestoneToFund(target);
                setFundModalOpen(true);
              }}
              onRelease={(target) => void handleReleaseMilestone(target)}
              onRefund={(target) => void handleRefundMilestone(target)}
              onReview={async (target) => {
                try {
                  const res = await contractApiRequest.getSubmissions(
                    contract.id,
                    target.id,
                  );
                  const data = extractContractData(res);
                  if (data && data.length > 0 && data[0]) {
                    setReviewContext({
                      milestone: target,
                      submission: data[0],
                    });
                    setReviewModalOpen(true);
                  } else {
                    router.push(
                      `${basePath}/contracts/${encodeURIComponent(contract.slug || String(contract.id))}/milestones/${target.id}`,
                    );
                  }
                } catch {
                  router.push(
                    `${basePath}/contracts/${encodeURIComponent(contract.slug || String(contract.id))}/milestones/${target.id}`,
                  );
                }
              }}
              onSubmitWork={(target) => {
                setMilestoneToSubmit(target);
                setSubmitModalOpen(true);
              }}
              onStartWork={(target) => void handleStartWork(target)}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center space-y-3">
          <Clock className="size-8 mx-auto text-muted-foreground/60" />
          <h3 className="text-sm font-bold text-foreground">
            No milestones found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {isClient
              ? "You can add milestones to break down the project deliverables and securely release payments."
              : "No milestones matching this filter."}
          </p>
          {canManageMilestones && (
            <Button
              onClick={() => {
                setMilestoneToEdit(null);
                setMilestoneModalOpen(true);
              }}
              className="rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="mr-1.5 size-4" />
              Add First Milestone
            </Button>
          )}
        </div>
      )}

      {/* ── 5. Dialogs & Modals ── */}

      {/* 1. Manage / Add / Edit Milestone Dialog (Client) */}
      {isClient && (
        <ManageMilestoneDialog
          open={milestoneModalOpen}
          onOpenChange={setMilestoneModalOpen}
          contractId={contract.id}
          totalContractAmount={totalAmount}
          currentAllocatedAmount={currentAllocatedAmount}
          contractExpiresAt={contract.expiresAt}
          milestoneToEdit={milestoneToEdit}
          isAmountLocked={Boolean(
            milestoneToEdit &&
              contract.status === "PENDING_SIGN" &&
              contract.holdMilestoneIds?.includes(milestoneToEdit.id),
          )}
        />
      )}

      {/* 2. Submit Milestone Dialog (Freelancer) */}
      {isFreelancer && (
        <SubmitMilestoneDialog
          open={submitModalOpen}
          onOpenChange={setSubmitModalOpen}
          contractId={contract.id}
          milestone={milestoneToSubmit}
        />
      )}

      {/* 3. Review Submission Dialog (Client) */}
      {isClient && reviewContext && (
        <ReviewSubmissionDialog
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          contractId={contract.id}
          milestoneId={reviewContext.milestone.id}
          milestoneTitle={reviewContext.milestone.title}
          milestoneAmount={Number(reviewContext.milestone.amount)}
          submission={reviewContext.submission}
        />
      )}

      {/* 4. Fund Milestone Escrow Dialog (Client) */}
      {isClient && (
        <FundMilestoneDialog
          open={fundModalOpen}
          onOpenChange={setFundModalOpen}
          contractId={contract.id}
          milestone={milestoneToFund}
        />
      )}
    </div>
  );
}

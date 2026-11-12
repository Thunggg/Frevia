"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/shadcn/dropdown-menu";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { contractApiRequest, extractContractData } from "@/apiRequests/contract";
import { paymentApiRequest } from "@/apiRequests/payment";
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
  const isFreelancer = basePath === "/freelancer";
  const isClient = !isFreelancer;

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

  // Financial metrics (clean numbers)
  const totalAmount = Number(contract.totalAmount) || 0;

  const currentAllocatedAmount = useMemo(() => {
    return milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  }, [milestones]);

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

  const filterOptions = [
    { key: "ALL", label: "All Milestone Status" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "SUBMITTED", label: "Ready for Review" },
    { key: "LATE", label: "Late / Overdue" },
    { key: "PENDING_ESCROW", label: "Pending Escrow" },
    { key: "COMPLETED", label: "Completed" },
  ];

  const currentFilterLabel =
    filterOptions.find((f) => f.key === statusFilter)?.label || "All Status";

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      {/* ── Breadcrumb & Top Bar ── */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3 text-xs">
        <Link
          href={`${basePath}/contracts`}
          className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          <span>Contracts</span>
        </Link>
        <span className="text-muted-foreground/60">/</span>
        <Link
          href={`${basePath}/contracts/${encodeURIComponent(contract.slug || String(contract.id))}`}
          className="font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {contract.slug || contractCode}
        </Link>
        <span className="text-muted-foreground/60">/</span>
        <span className="font-semibold text-foreground">Milestone</span>
      </div>

      {/* ── Main Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* ── Table Toolbar (Search & Status Dropdown matching reference image) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search milestones..."
                className="w-full h-9 rounded-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-9 pr-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-[#0069D3]"
              />
            </div>

            {/* Status Dropdown (Matching "All Shipment Status" dropdown in reference image) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium text-zinc-700 dark:text-zinc-300 gap-1.5"
                >
                  <Filter className="size-3.5 text-zinc-400" />
                  <span>{currentFilterLabel}</span>
                  <ChevronDown className="size-3.5 text-zinc-400 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 text-xs">
                {filterOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.key}
                    onClick={() => setStatusFilter(opt.key)}
                    className="flex items-center justify-between cursor-pointer py-2"
                  >
                    <span
                      className={
                        statusFilter === opt.key
                          ? "font-semibold text-zinc-950 dark:text-zinc-100"
                          : "text-zinc-600 dark:text-zinc-400"
                      }
                    >
                      {opt.label}
                    </span>
                    {statusFilter === opt.key && (
                      <Check className="size-3.5 text-[#0069D3]" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Milestone counter */}
          <div className="text-xs text-zinc-500 font-medium">
            Showing <strong>{filteredMilestones.length}</strong> of{" "}
            <strong>{milestones.length}</strong> milestones
          </div>
        </div>

        {/* Client Add Milestone Button (Only when contract is PENDING_SIGN or AWAITING_PAYMENT) */}
        {canManageMilestones && (
          <Button
            onClick={() => {
              setMilestoneToEdit(null);
              setMilestoneModalOpen(true);
            }}
            className="rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold h-9 px-4 shadow-xs cursor-pointer self-start lg:self-auto"
          >
            <Plus className="mr-1.5 size-4" />
            Add New Milestone
          </Button>
        )}
      </div>

      {/* ── Milestones Data Table (Matching reference image structure) ── */}
      {filteredMilestones.length > 0 ? (
        <div className="rounded-sm border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 overflow-hidden shadow-2xs">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/80 dark:border-zinc-800 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/40">
                  <th className="py-3 px-4">Milestone ID</th>
                  <th className="py-3 px-4">Title & Scope</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Expected Due</th>
                  <th className="py-3 px-4 text-right">Amount (USD)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredMilestones.map((m, idx) => (
                  <MilestoneCard
                    key={m.id}
                    variant="table-row"
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
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800/80 px-4">
            {filteredMilestones.map((m, idx) => (
              <MilestoneCard
                key={m.id}
                variant="card"
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
                      `${basePath}/contracts/${contract.slug || contract.id}/milestones/${target.id}`,
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
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-12 text-center space-y-3">
          <Clock className="size-8 mx-auto text-zinc-400" />
          <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
            No milestones found
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
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
              className="rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="mr-1.5 size-4" />
              Add First Milestone
            </Button>
          )}
        </div>
      )}

      {/* ── Dialogs ── */}

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

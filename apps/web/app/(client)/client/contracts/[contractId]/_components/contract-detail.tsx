"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Flag,
  Lightbulb,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Trash2,
  XCircle,
} from "@/components/icons";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/shadcn/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/shadcn/dropdown-menu";
import { FreelancerProfileSheet } from "@/app/(client)/_components/freelancer-profile-sheet";
import { contractApiRequest, extractContractData } from "@/apiRequests/contract";
import { ApiFail } from "@/lib/http";
import type {
  ContractDetailType,
  GetMilestoneListResponseType,
  GetSubmissionResponseType,
  MilestoneType,
} from "@shared/types";
import { CreateMilestoneDialog } from "./create-milestone-dialog";
import { EditContractSheet } from "./edit-contract-sheet";
import { MilestoneCard } from "./milestone-card";
import { ReviewSubmissionDialog } from "./review-submission-dialog";
import { useCreateConversation } from "@/hooks/use-conversation";

function money(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | Date | null) {
  if (!date) return "Not specified";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

interface ContractDetailProps {
  initialContract: ContractDetailType;
  initialMilestones?: GetMilestoneListResponseType | null;
}

export function ContractDetail({
  initialContract,
  initialMilestones,
}: ContractDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [createMilestoneOpen, setCreateMilestoneOpen] = useState(false);
  const [editContractOpen, setEditContractOpen] = useState(false);
  const [fullContractOpen, setFullContractOpen] = useState(false);
  const [milestoneToEdit, setMilestoneToEdit] = useState<MilestoneType | null>(
    null,
  );

  // Review submission state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [activeReviewMilestone, setActiveReviewMilestone] =
    useState<MilestoneType | null>(null);
  const [activeSubmission, setActiveSubmission] =
    useState<GetSubmissionResponseType | null>(null);

  // Confirmation dialogs
  const [confirmSign, setConfirmSign] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] =
    useState<MilestoneType | null>(null);

  // Loading states
  const [isSigning, setIsSigning] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeletingMilestone, setIsDeletingMilestone] = useState(false);

  // Queries
  const { data: contract } = useQuery<ContractDetailType>({
    queryKey: ["client-contract-detail", initialContract.id],
    queryFn: () =>
      contractApiRequest
        .getContractDetail(initialContract.id)
        .then(extractContractData),
    initialData: initialContract,
  });

  const { data: milestonesRes } = useQuery<GetMilestoneListResponseType>({
    queryKey: ["client-contract-milestones", initialContract.id],
    queryFn: () =>
      contractApiRequest
        .getMilestones(initialContract.id, { limit: 50 })
        .then(extractContractData),
    initialData: initialMilestones ?? undefined,
  });

  const milestones = useMemo(
    () => milestonesRes?.data ?? initialMilestones?.data ?? [],
    [milestonesRes, initialMilestones],
  );

  // Financial aggregates
  const totalContractAmount = contract.totalAmount;
  const allocatedAmount = useMemo(
    () =>
      milestones.reduce(
        (sum: number, m: MilestoneType) => sum + Number(m.amount),
        0,
      ),
    [milestones],
  );
  const paidAmount = useMemo(
    () =>
      milestones
        .filter((m: MilestoneType) => m.status === "COMPLETED")
        .reduce(
          (sum: number, m: MilestoneType) => sum + Number(m.amount),
          0,
        ),
    [milestones],
  );

  const percentPaid =
    totalContractAmount > 0
      ? Math.min(100, Math.round((paidAmount / totalContractAmount) * 100))
      : 0;
  const remainingPaidAmount = Math.max(0, totalContractAmount - paidAmount);
  const remainingBudget = Math.max(0, totalContractAmount - allocatedAmount);

  const freelancer = contract.freelancer;
  const freelancerName = freelancer?.profile?.displayName || "Freelancer";
  const avatarUrl = freelancer?.profile?.avatarUrl;

  // Actions
  const handleSign = async () => {
    setIsSigning(true);
    try {
      await contractApiRequest.sign(contract.id);
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contracts"],
      });
      toastSuccess({
        message: "You have signed the contract agreement!",
      });
      setConfirmSign(false);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to sign contract. Please try again.",
      });
    } finally {
      setIsSigning(false);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await contractApiRequest.complete(contract.id);
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contracts"],
      });
      toastSuccess({ message: "Contract marked as completed!" });
      setConfirmComplete(false);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to complete contract. Please try again.",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await contractApiRequest.cancel(contract.id);
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contracts"],
      });
      toastSuccess({ message: "Contract has been cancelled." });
      setConfirmCancel(false);
      router.push("/client/contracts");
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to cancel contract. Please try again.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDeleteMilestone = async () => {
    if (!milestoneToDelete) return;
    setIsDeletingMilestone(true);
    try {
      await contractApiRequest.deleteMilestone(
        contract.id,
        milestoneToDelete.id,
      );
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contract.id],
      });
      toastSuccess({ message: "Milestone removed successfully." });
      setMilestoneToDelete(null);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to delete milestone.",
      });
    } finally {
      setIsDeletingMilestone(false);
    }
  };

  // Status Badge for top header
  const getTopStatusBadge = () => {
    switch (contract.status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold bg-[#D0E1F8] text-[#0069D3] border border-[#0069D3]/20">
            Active
          </span>
        );
      case "PENDING_SIGN":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold bg-[#F1F0F5] text-foreground border border-border">
            Pending Sign
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold bg-[#F1F0F5] text-[#0069D3] border border-border">
            Completed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold bg-muted text-muted-foreground border border-border">
            {contract.status}
          </span>
        );
    }
  };

  const createConversation = useCreateConversation();
  const [isStartingChat, setIsStartingChat] = useState(false);

  const handleMessageFreelancer = async () => {
    if (!contract.freelancerId) {
      router.push("/client/conversations");
      return;
    }

    setIsStartingChat(true);
    try {
      const conv = await createConversation.mutateAsync(contract.freelancerId);
      router.push(`/client/conversations/${conv.id}`);
    } catch (error) {
      toastError({
        message:
          error instanceof Error
            ? error.message
            : "Failed to open conversation with freelancer.",
      });
      router.push("/client/conversations");
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {contract.job?.title || "Contract Agreement"}
            </h1>
          </div>

          {/* Action Menu (...) */}
          <div className="flex items-center gap-2">
            {getTopStatusBadge()}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-xl border-border bg-card text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl p-1">
                <DropdownMenuItem
                  onClick={() => {
                    setMilestoneToEdit(null);
                    setCreateMilestoneOpen(true);
                  }}
                  className="cursor-pointer text-xs font-medium"
                >
                  <Plus className="mr-2 size-3.5" />
                  Add Milestone
                </DropdownMenuItem>
                {contract.status === "PENDING_SIGN" &&
                  !contract.signedByClient && (
                    <DropdownMenuItem
                      onClick={() => setEditContractOpen(true)}
                      className="cursor-pointer text-xs font-medium"
                    >
                      <FileText className="mr-2 size-3.5 text-[#0069D3]" />
                      Edit Contract Terms
                    </DropdownMenuItem>
                  )}
                <DropdownMenuItem
                  onClick={() => setFullContractOpen(true)}
                  className="cursor-pointer text-xs font-medium"
                >
                  <FileText className="mr-2 size-3.5" />
                  View Full Agreement
                </DropdownMenuItem>
                {contract.status === "ACTIVE" && (
                  <DropdownMenuItem
                    onClick={() => setConfirmComplete(true)}
                    className="cursor-pointer text-xs font-medium text-emerald-600"
                  >
                    <CheckCircle2 className="mr-2 size-3.5" />
                    Complete Contract
                  </DropdownMenuItem>
                )}
                {contract.status !== "COMPLETED" &&
                  contract.status !== "CANCELLED" && (
                    <DropdownMenuItem
                      onClick={() => setConfirmCancel(true)}
                      className="cursor-pointer text-xs font-medium text-red-600"
                    >
                      <XCircle className="mr-2 size-3.5" />
                      Cancel Contract
                    </DropdownMenuItem>
                  )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Contract Details */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5 text-foreground">
                <div className="flex size-8 items-center justify-center text-foreground">
                  <FileText className="size-5" />
                </div>
                <h2 className="text-base font-semibold">Contract Details</h2>
              </div>
              {contract.status === "PENDING_SIGN" && !contract.signedByClient && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditContractOpen(true)}
                  className="rounded-full text-xs gap-1.5 h-8 border-border hover:bg-accent"
                >
                  <FileText className="size-3.5 text-[#0069D3]" />
                  Edit Contract
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
              {/* Left Subcolumn */}
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                    Job
                  </span>
                  <Link
                    href={`/client/jobs/${contract.jobId}`}
                    className="text-sm font-semibold text-[#0069D3] hover:underline mt-0.5 inline-block"
                  >
                    {contract.job?.title || "View Job Posting"}
                  </Link>
                </div>

                <div>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                    Freelancer
                  </span>
                  <div
                    onClick={() => setProfileSheetOpen(true)}
                    className="flex items-center gap-2.5 mt-1 cursor-pointer group"
                  >
                    <Avatar className="size-8 border border-border">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="text-xs font-bold">
                        {freelancerName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-xs font-bold text-foreground group-hover:text-[#0069D3] transition-colors block">
                        {freelancerName}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                    Total Amount
                  </span>
                  <span className="text-sm font-bold text-foreground mt-0.5 block">
                    {money(totalContractAmount)}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                    Payment Method
                  </span>
                  <span className="text-xs font-medium text-foreground mt-0.5 block">
                    Escrow / Milestone Release
                  </span>
                </div>
              </div>

              {/* Right Subcolumn */}
              <div className="flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                    Description & Scope
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-5 whitespace-pre-wrap">
                    {contract.terms ||
                      "A modern and responsive delivery plan for this project, including milestones, deliverables, and quality criteria agreed upon between client and freelancer."}
                  </p>
                </div>
                {/* Top Dates Row */}
                <div className="flex flex-wrap items-center gap-6 pt-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center text-muted-foreground">
                      <CalendarDays className="size-5" />
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">
                        Created
                      </span>
                      <span className="text-foreground">
                        {formatDate(contract.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center text-muted-foreground">
                      <Clock className="size-5" />
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">
                        Start Date
                      </span>
                      <span className="text-foreground">
                        {formatDate(contract.signedAt || contract.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center text-muted-foreground">
                      <CalendarDays className="size-5" />
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">
                        Due Date
                      </span>
                      <span className="text-foreground">
                        {formatDate(contract.expiresAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Milestones Section */}
          {/* Card 2: Milestones List */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-[#F1F0F5] text-[#0069D3]">
                  <Flag className="size-4" />
                </div>
                <h2 className="text-base font-bold text-foreground">
                  Milestones
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-medium">
                  {milestones.length} milestone{milestones.length !== 1 ? "s" : ""}
                </span>
                <Button
                  size="sm"
                  onClick={() => {
                    setMilestoneToEdit(null);
                    setCreateMilestoneOpen(true);
                  }}
                  className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold h-8 px-3.5 shadow-xs"
                >
                  <Plus className="mr-1 size-3.5" />
                  Add Milestone
                </Button>
              </div>
            </div>

            {/* List of Milestone Cards */}
            {milestones.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-10 text-center">
                <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-[#F1F0F5] text-[#0069D3]">
                  <Flag className="size-5" />
                </div>
                <p className="text-xs font-semibold text-foreground">
                  No milestones defined yet
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground max-w-xs">
                  Add phases to break down work and safely release payments.
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setMilestoneToEdit(null);
                    setCreateMilestoneOpen(true);
                  }}
                  className="mt-3 rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-medium"
                >
                  <Plus className="mr-1 size-3" />
                  Add First Milestone
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {milestones.map((milestone: MilestoneType, index: number) => (
                  <MilestoneCard
                    key={milestone.id}
                    contractId={contract.id}
                    milestone={milestone}
                    index={index}
                    onEdit={(m) => {
                      setMilestoneToEdit(m);
                      setCreateMilestoneOpen(true);
                    }}
                    onDelete={(m) => {
                      setMilestoneToDelete(m);
                    }}
                    onReview={(m, sub) => {
                      setActiveReviewMilestone(m);
                      setActiveSubmission(sub);
                      setReviewOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Contract Summary */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <h3 className="text-base font-bold text-foreground">
              Contract Summary
            </h3>

            <div className="mt-4">
              <span className="text-3xl font-extrabold text-foreground tracking-tight block">
                {money(totalContractAmount)}
              </span>
              <span className="text-xs text-muted-foreground block mt-0.5">
                Total Amount
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-5 space-y-2">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0069D3] transition-all"
                  style={{ width: `${percentPaid}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                <span>
                  {money(paidAmount)} paid ({percentPaid}%)
                </span>
                <span>{money(remainingPaidAmount)} remaining</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2.5">
              {contract.status === "PENDING_SIGN" ? (
                !contract.signedByClient ? (
                  <Button
                    onClick={() => setConfirmSign(true)}
                    className="w-full rounded-xl bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold py-2.5 shadow-xs"
                  >
                    <ShieldCheck className="mr-1.5 size-4" />
                    Sign Contract Agreement
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="w-full rounded-xl bg-[#F1F0F5] border border-border text-muted-foreground text-xs font-semibold py-2.5 opacity-80"
                  >
                    <Clock className="mr-1.5 size-4" />
                    Awaiting Freelancer Signature
                  </Button>
                )
              ) : (
                <Button
                  onClick={() => {
                    setMilestoneToEdit(null);
                    setCreateMilestoneOpen(true);
                  }}
                  className="w-full rounded-xl bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold py-2.5 shadow-xs"
                >
                  Make a Payment / Add Milestone
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                disabled={isStartingChat}
                onClick={() => void handleMessageFreelancer()}
                className="w-full rounded-xl border-border text-foreground hover:bg-muted text-xs font-semibold py-2.5 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isStartingChat ? (
                  <Loader2 className="size-3.5 animate-spin text-[#0069D3]" />
                ) : (
                  <MessageSquare className="size-3.5 text-muted-foreground" />
                )}
                <span>Message Freelancer</span>
              </Button>
            </div>
          </div>

          {/* Card 2: How milestones work? */}
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-full bg-[#D0E1F8] text-[#0069D3]">
                <Lightbulb className="size-4" />
              </div>
              <h4 className="text-sm font-bold text-foreground">
                How milestones work?
              </h4>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Funds are kept secure and released only when you approve each
              milestone. This ensures both you and the freelancer are protected
              throughout the project.
            </p>

            <div className="pt-1">
              <button
                type="button"
                className="text-xs font-semibold text-[#0069D3] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Learn more &gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet: Create or Edit Milestone */}
      <CreateMilestoneDialog
        open={createMilestoneOpen}
        onOpenChange={(open) => {
          setCreateMilestoneOpen(open);
          if (!open) setMilestoneToEdit(null);
        }}
        contractId={contract.id}
        maxAllowedAmount={remainingBudget}
        milestoneToEdit={milestoneToEdit}
      />

      {/* Sheet: Edit Contract Agreement */}
      <EditContractSheet
        open={editContractOpen}
        onOpenChange={setEditContractOpen}
        contract={contract}
        minAllowedAmount={allocatedAmount}
      />

      {/* Sheet: Review Submission */}
      {activeReviewMilestone && (
        <ReviewSubmissionDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          contractId={contract.id}
          milestoneId={activeReviewMilestone.id}
          milestoneTitle={activeReviewMilestone.title}
          milestoneAmount={Number(activeReviewMilestone.amount)}
          submission={activeSubmission}
        />
      )}

      {/* Sheet: View Full Contract Agreement */}
      <Sheet open={fullContractOpen} onOpenChange={setFullContractOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg md:max-w-xl overflow-y-auto p-6 flex flex-col justify-between font-sans border-l border-border bg-background shadow-2xl z-50"
        >
          <div>
            <SheetHeader className="p-0 pb-4 border-b border-border/60">
              <div className="flex items-center gap-2 text-foreground">
                <FileText className="size-5 text-[#0069D3]" />
                <SheetTitle className="text-lg font-bold">
                  Contract Agreement #{contract.id}
                </SheetTitle>
              </div>
              <SheetDescription className="mt-1 text-xs text-muted-foreground">
                {contract.job?.title}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3">
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Total Amount
                  </span>
                  <span className="font-bold text-foreground">
                    {money(totalContractAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Status
                  </span>
                  <span className="font-semibold text-foreground">
                    {contract.status}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-foreground block mb-1">
                  Terms of Service & Delivery
                </span>
                <div className="rounded-xl border border-border bg-card p-4 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {contract.terms ||
                    "Standard Frevia Freelance Contract. Deliverables are submitted per milestone, reviewed by the client, and payments are released accordingly upon satisfaction."}
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog: Confirm Sign Contract */}
      <AlertDialog open={confirmSign} onOpenChange={setConfirmSign}>
        <AlertDialogContent className="max-w-sm rounded-[24px] border border-border bg-background p-5 shadow-2xl font-sans">
          <div className="flex flex-col gap-3">
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Sign Contract Agreement
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              By signing, you formally confirm the scope and budget of{" "}
              <span className="font-semibold text-foreground">
                {money(totalContractAmount)}
              </span>{" "}
              for this project with {freelancerName}.
            </AlertDialogDescription>
            <div className="mt-2 flex flex-col gap-2">
              <Button
                disabled={isSigning}
                onClick={() => void handleSign()}
                className="w-full rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold"
              >
                {isSigning ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-1.5 size-3.5" />
                )}
                Confirm & Sign Agreement
              </Button>
              <AlertDialogCancel asChild>
                <Button
                  variant="outline"
                  disabled={isSigning}
                  className="w-full rounded-full text-xs"
                >
                  Cancel
                </Button>
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Confirm Complete Contract */}
      <AlertDialog open={confirmComplete} onOpenChange={setConfirmComplete}>
        <AlertDialogContent className="max-w-sm rounded-[24px] border border-border bg-background p-5 shadow-2xl font-sans">
          <div className="flex flex-col gap-3">
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Complete Contract
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to mark this contract as completed? All agreed
              milestones should be reviewed and approved prior to completion.
            </AlertDialogDescription>
            <div className="mt-2 flex flex-col gap-2">
              <Button
                disabled={isCompleting}
                onClick={() => void handleComplete()}
                className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                {isCompleting ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 size-3.5" />
                )}
                Mark as Completed
              </Button>
              <AlertDialogCancel asChild>
                <Button
                  variant="outline"
                  disabled={isCompleting}
                  className="w-full rounded-full text-xs"
                >
                  Cancel
                </Button>
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Confirm Cancel Contract */}
      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent className="max-w-sm rounded-[24px] border border-border bg-background p-5 shadow-2xl font-sans">
          <div className="flex flex-col gap-3">
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Cancel Contract
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to cancel this contract? This action cannot be
              undone.
            </AlertDialogDescription>
            <div className="mt-2 flex flex-col gap-2">
              <Button
                disabled={isCancelling}
                onClick={() => void handleCancel()}
                className="w-full rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                {isCancelling ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <XCircle className="mr-1.5 size-3.5" />
                )}
                Confirm Cancellation
              </Button>
              <AlertDialogCancel asChild>
                <Button
                  variant="outline"
                  disabled={isCancelling}
                  className="w-full rounded-full text-xs"
                >
                  Go Back
                </Button>
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Confirm Delete Milestone */}
      <AlertDialog
        open={!!milestoneToDelete}
        onOpenChange={(open) => !open && setMilestoneToDelete(null)}
      >
        <AlertDialogContent className="max-w-sm rounded-[24px] border border-border bg-background p-5 shadow-2xl font-sans">
          <div className="flex flex-col gap-3">
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete Milestone
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Remove &ldquo;{milestoneToDelete?.title}&rdquo;? The allocated amount
              will return to your unallocated budget.
            </AlertDialogDescription>
            <div className="mt-2 flex flex-col gap-2">
              <Button
                disabled={isDeletingMilestone}
                onClick={() => void handleDeleteMilestone()}
                className="w-full rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                {isDeletingMilestone ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="mr-1.5 size-3.5" />
                )}
                Delete Milestone
              </Button>
              <AlertDialogCancel asChild>
                <Button
                  variant="outline"
                  disabled={isDeletingMilestone}
                  className="w-full rounded-full text-xs"
                >
                  Cancel
                </Button>
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Embedded Freelancer Profile Sheet */}
      <FreelancerProfileSheet
        open={profileSheetOpen}
        onOpenChange={setProfileSheetOpen}
        profileId={freelancer?.id ?? null}
        initialData={{
          displayName: freelancerName,
          avatarUrl: avatarUrl ?? null,
          title: null,
          freelancerId: freelancer?.id,
        }}
      />
    </div>
  );
}

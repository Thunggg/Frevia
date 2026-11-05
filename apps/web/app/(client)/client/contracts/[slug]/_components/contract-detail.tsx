"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Flag,
  Loader2,
  MoreHorizontal,
  Plus,
  RotateCcw,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
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
  GetSharedFilesResponseType,
  GetSubmissionResponseType,
  MilestoneType,
} from "@shared/types";
import { CreateMilestoneDialog } from "./create-milestone-dialog";
import { EditContractSheet } from "./edit-contract-sheet";
import { MilestoneCard } from "./milestone-card";
import { ReviewSubmissionDialog } from "./review-submission-dialog";
import { SharedFilesSection } from "./shared-files-section";
import { PaperContractCard } from "./paper-contract-card";
import { SubmitMilestoneDialog } from "./submit-milestone-dialog";
import { DisputeDialog } from "./dispute-dialog";
import { useCreateConversation } from "@/hooks/use-conversation";
import { StripePaymentDialog } from "@/components/payments/stripe-payment-dialog";
import { paymentApiRequest } from "@/apiRequests/payment";

interface ContractDetailProps {
  initialContract: ContractDetailType;
  initialMilestones?: GetMilestoneListResponseType | null;
  initialSharedFiles?: GetSharedFilesResponseType | null;
  basePath?: string;
}

export function ContractDetail({
  initialContract,
  initialMilestones,
  initialSharedFiles,
  basePath = "/client",
}: ContractDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("contractDetail");
  const tStatus = useTranslations("contractStatus");
  const tRole = useTranslations("roleName");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  const money = (amount: number | string, currency: string = "USD") =>
    format.number(Number(amount), {
      style: "currency",
      currency: currency ? currency.toUpperCase() : "USD",
      maximumFractionDigits: 0,
    });

  const formatDate = (date: string | Date | null) =>
    date
      ? format.dateTime(new Date(date), {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      : t("notSpecified");

  const isFreelancer = basePath === "/freelancer";
  const [milestoneToSubmit, setMilestoneToSubmit] =
    useState<MilestoneType | null>(null);

  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [createMilestoneOpen, setCreateMilestoneOpen] = useState(false);
  const [editContractOpen, setEditContractOpen] = useState(false);
  const [fullContractOpen, setFullContractOpen] = useState(false);
  const [milestoneToEdit, setMilestoneToEdit] = useState<MilestoneType | null>(
    null,
  );

  // Review submission state (Client only)
  const [reviewOpen, setReviewOpen] = useState(false);
  const [activeReviewMilestone, setActiveReviewMilestone] =
    useState<MilestoneType | null>(null);
  const [activeSubmission, setActiveSubmission] =
    useState<GetSubmissionResponseType | null>(null);

  // Dispute state (Both Client and Freelancer)
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeMilestone, setDisputeMilestone] = useState<MilestoneType | null>(null);
  const [disputeMode, setDisputeMode] = useState<"CREATE" | "VIEW">("VIEW");

  // Confirmation dialogs
  const [confirmSign, setConfirmSign] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] =
    useState<MilestoneType | null>(null);

  // Stripe Payment dialog state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalConfig, setPaymentModalConfig] = useState<{
    clientSecret: string;
    amount: number;
    title: string;
    description: string;
  } | null>(null);
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);

  // 1-Click Saved Card Modal State
  const [oneClickModal, setOneClickModal] = useState<{
    open: boolean;
    type: "PLATFORM_FEE" | "MILESTONE_FUND";
    milestone?: MilestoneType;
    amount: number;
    title: string;
  } | null>(null);
  const [isProcessingOneClick, setIsProcessingOneClick] = useState(false);
  const [selectedPmId, setSelectedPmId] = useState<string>("");

  // Query Saved Payment Methods
  const { data: savedCardsData, refetch: refetchSavedCards } = useQuery({
    queryKey: ["client-saved-cards"],
    queryFn: async () => {
      const res = await paymentApiRequest.getSavedPaymentMethods();
      return res.data;
    },
  });

  // Search params to handle redirect back from Stripe Checkout
  const searchParams = useSearchParams();

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");

    if (paymentStatus === "success" && sessionId) {
      const syncSession = async () => {
        try {
          await paymentApiRequest.syncCheckoutSession(sessionId);
          toastSuccess({
            message: "Payment completed successfully! Escrow deposit has been updated.",
          });
        } catch {
          // If already processed via webhook
        } finally {
          await queryClient.invalidateQueries({
            queryKey: ["client-contract-detail", initialContract.id],
          });
          await queryClient.invalidateQueries({
            queryKey: ["client-contract-milestones", initialContract.id],
          });
          await queryClient.invalidateQueries({
            queryKey: ["client-contract-transactions", initialContract.id],
          });
          const newUrl = window.location.pathname;
          window.history.replaceState({}, "", newUrl);
        }
      };
      void syncSession();
    } else if (paymentStatus === "cancelled") {
      toastError({
        message: "Payment was cancelled. You can retry at any time.",
      });
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, initialContract.id, queryClient]);

  // Escrow Release / Refund dialog states
  const [milestoneToRelease, setMilestoneToRelease] =
    useState<MilestoneType | null>(null);
  const [isReleasingMilestone, setIsReleasingMilestone] = useState(false);

  const [milestoneToRefund, setMilestoneToRefund] =
    useState<MilestoneType | null>(null);
  const [isRefundingMilestone, setIsRefundingMilestone] = useState(false);

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

  const { data: contractTransactionsRes, isLoading: isTransactionsLoading } =
    useQuery({
      queryKey: ["contract-transactions", initialContract.id],
      queryFn: () =>
        paymentApiRequest
          .getTransactions({ contractId: initialContract.id, limit: 10 })
          .then((res) => res.data),
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
  const remainingBudget = Math.max(0, totalContractAmount - allocatedAmount);
  const hasAnyInProgressMilestone = useMemo(
    () => milestones.some((m: MilestoneType) => m.status === "IN_PROGRESS"),
    [milestones],
  );

  const { data: sharedFilesList = [] } = useQuery<GetSharedFilesResponseType>({
    queryKey: ["contract-shared-files", contract.id],
    queryFn: () =>
      contractApiRequest.getSharedFiles(contract.id).then(extractContractData),
    initialData: initialSharedFiles ?? undefined,
  });

  const contractPdfFile = useMemo(() => {
    return (
      sharedFilesList.find(
        (f) => f.fileName && f.fileName.toLowerCase().endsWith(".pdf"),
      ) || null
    );
  }, [sharedFilesList]);

  const freelancer = contract.freelancer;
  const freelancerName = freelancer?.profile?.displayName || tRole("FREELANCER");
  const avatarUrl = freelancer?.profile?.avatarUrl;

  const client = contract.client;
  const clientName = client?.profile?.displayName || tRole("CLIENT");
  const clientAvatarUrl = client?.profile?.avatarUrl;

  const isSignedByMe = isFreelancer
    ? contract.signedByFreelancer
    : contract.signedByClient;

  const contractStatusText = (
    [
      "ACTIVE",
      "PENDING_SIGN",
      "COMPLETED",
      "CANCELLED",
      "DISPUTED",
    ] as readonly string[]
  ).includes(contract.status)
    ? tStatus(contract.status)
    : contract.status;

  const handleStartMilestone = async (milestone: MilestoneType) => {
    try {
      await contractApiRequest.progressMilestone(contract.id, milestone.id);
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      toastSuccess({
        message: t("startedWork", { title: milestone.title }),
      });
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("startFailed"),
      });
    }
  };

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
        message: t("signed"),
      });
      setConfirmSign(false);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("signFailed"),
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
      toastSuccess({ message: t("completed") });
      setConfirmComplete(false);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("completeFailed"),
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
      toastSuccess({ message: t("cancelled") });
      setConfirmCancel(false);
      router.push(`${basePath}/contracts`);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("cancelFailed"),
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
      toastSuccess({ message: t("milestoneRemoved") });
      setMilestoneToDelete(null);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("milestoneDeleteFailed"),
      });
    } finally {
      setIsDeletingMilestone(false);
    }
  };

  const handleFundMilestone = async (milestone: MilestoneType) => {
    const savedCards = savedCardsData?.paymentMethods || [];
    if (savedCards.length > 0) {
      const defaultCard = savedCards.find((p) => p.isDefault) || savedCards[0];
      setSelectedPmId(defaultCard?.id || "");
      setOneClickModal({
        open: true,
        type: "MILESTONE_FUND",
        milestone,
        amount: Number(milestone.amount),
        title: `Fund Milestone: ${milestone.title}`,
      });
      return;
    }

    setIsInitiatingPayment(true);
    try {
      const res = await paymentApiRequest.createMilestoneFundCheckoutSession(
        contract.id,
        milestone.id,
      );
      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      }
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to initiate milestone deposit.",
      });
      setIsInitiatingPayment(false);
    }
  };

  const handleConfirmOneClickPay = async () => {
    if (!oneClickModal) return;
    setIsProcessingOneClick(true);
    try {
      if (oneClickModal.type === "PLATFORM_FEE") {
        await paymentApiRequest.payPlatformFeeWithSavedCard(
          contract.id,
          selectedPmId || undefined,
        );
        toastSuccess({ message: "Platform fee paid successfully!" });
      } else if (
        oneClickModal.type === "MILESTONE_FUND" &&
        oneClickModal.milestone
      ) {
        await paymentApiRequest.fundMilestoneWithSavedCard(
          contract.id,
          oneClickModal.milestone.id,
          selectedPmId || undefined,
        );
        toastSuccess({
          message: "Milestone funds deposited successfully via saved card!",
        });
      }
      setOneClickModal(null);
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-transactions", contract.id],
      });
      void refetchSavedCards();
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Payment with saved card failed. Redirecting to Stripe Checkout...",
      });
      if (oneClickModal.type === "PLATFORM_FEE") {
        const res =
          await paymentApiRequest.createPlatformFeeCheckoutSession(contract.id);
        if (res.data.checkoutUrl) window.location.href = res.data.checkoutUrl;
      } else if (
        oneClickModal.type === "MILESTONE_FUND" &&
        oneClickModal.milestone
      ) {
        const res =
          await paymentApiRequest.createMilestoneFundCheckoutSession(
            contract.id,
            oneClickModal.milestone.id,
          );
        if (res.data.checkoutUrl) window.location.href = res.data.checkoutUrl;
      }
    } finally {
      setIsProcessingOneClick(false);
    }
  };

  const handlePayViaStripeCheckoutFromModal = async () => {
    if (!oneClickModal) return;
    setIsInitiatingPayment(true);
    try {
      if (oneClickModal.type === "PLATFORM_FEE") {
        const res =
          await paymentApiRequest.createPlatformFeeCheckoutSession(contract.id);
        if (res.data.checkoutUrl) window.location.href = res.data.checkoutUrl;
      } else if (
        oneClickModal.type === "MILESTONE_FUND" &&
        oneClickModal.milestone
      ) {
        const res =
          await paymentApiRequest.createMilestoneFundCheckoutSession(
            contract.id,
            oneClickModal.milestone.id,
          );
        if (res.data.checkoutUrl) window.location.href = res.data.checkoutUrl;
      }
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to open Stripe Checkout.",
      });
      setIsInitiatingPayment(false);
    }
  };

  const handleOpenStripeCustomerPortal = async () => {
    try {
      const res = await paymentApiRequest.getCustomerPortalLink(
        window.location.href,
      );
      if (res.data?.portalUrl) {
        window.location.href = res.data.portalUrl;
      }
    } catch {
      toastError({ message: "Could not open Stripe Billing Portal." });
    }
  };

  const handleConfirmRelease = async () => {
    if (!milestoneToRelease) return;
    setIsReleasingMilestone(true);
    try {
      await paymentApiRequest.releaseMilestone(
        contract.id,
        milestoneToRelease.id,
      );
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["contract-transactions", contract.id],
      });
      toastSuccess({
        message: `Milestone funds (${money(Number(milestoneToRelease.amount))}) transferred to ${freelancerName} successfully!`,
      });
      setMilestoneToRelease(null);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to release milestone payment. Ensure freelancer has connected their Stripe payout account.",
      });
    } finally {
      setIsReleasingMilestone(false);
    }
  };

  const handleConfirmRefund = async () => {
    if (!milestoneToRefund) return;
    setIsRefundingMilestone(true);
    try {
      await paymentApiRequest.refundMilestone(
        contract.id,
        milestoneToRefund.id,
      );
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["contract-transactions", contract.id],
      });
      toastSuccess({
        message: "Milestone payment refunded to client card successfully.",
      });
      setMilestoneToRefund(null);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to refund milestone payment.",
      });
    } finally {
      setIsRefundingMilestone(false);
    }
  };

  // Status Badge for top header
  const getTopStatusBadge = () => {
    switch (contract.status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold bg-[#D0E1F8] text-[#0069D3] border border-[#0069D3]/20">
            {tStatus("ACTIVE")}
          </span>
        );
      case "PENDING_SIGN":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold bg-[#F1F0F5] text-foreground border border-border">
            {tStatus("PENDING_SIGN")}
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold bg-[#F1F0F5] text-[#0069D3] border border-border">
            {tStatus("COMPLETED")}
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
            {tStatus("CANCELLED")}
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

  const handleMessageCounterparty = async () => {
    const targetUserId = isFreelancer
      ? contract.clientId
      : contract.freelancerId;

    if (!targetUserId) {
      router.push(`${basePath}/conversations`);
      return;
    }

    setIsStartingChat(true);
    try {
      const conv = await createConversation.mutateAsync(targetUserId);
      router.push(`${basePath}/conversations/${conv.id}`);
    } catch (error) {
      toastError({
        message:
          error instanceof Error
            ? error.message
            : t("chatFailed", {
              role: isFreelancer ? tRole("CLIENT") : tRole("FREELANCER"),
            }),
      });
      router.push(`${basePath}/conversations`);
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
              {contract.job?.title || t("agreementFallback")}
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
                {!isFreelancer && (
                  <DropdownMenuItem
                    onClick={() => {
                      setMilestoneToEdit(null);
                      setCreateMilestoneOpen(true);
                    }}
                    className="cursor-pointer text-xs font-medium"
                  >
                    <Plus className="mr-2 size-3.5" />
                    {t("addMilestone")}
                  </DropdownMenuItem>
                )}
                {!isFreelancer &&
                  contract.status === "PENDING_SIGN" &&
                  !contract.signedByClient && (
                    <DropdownMenuItem
                      onClick={() => setEditContractOpen(true)}
                      className="cursor-pointer text-xs font-medium"
                    >
                      <FileText className="mr-2 size-3.5 text-[#0069D3]" />
                      {t("editContractTerms")}
                    </DropdownMenuItem>
                  )}
                <DropdownMenuItem
                  onClick={() => setFullContractOpen(true)}
                  className="cursor-pointer text-xs font-medium"
                >
                  <FileText className="mr-2 size-3.5" />
                  {t("viewFullAgreement")}
                </DropdownMenuItem>
                {!isFreelancer && contract.status === "ACTIVE" && (
                  <DropdownMenuItem
                    onClick={() => setConfirmComplete(true)}
                    className="cursor-pointer text-xs font-medium text-emerald-600"
                  >
                    <CheckCircle2 className="mr-2 size-3.5" />
                    {t("completeContract")}
                  </DropdownMenuItem>
                )}
                {contract.status !== "COMPLETED" &&
                  contract.status !== "CANCELLED" && (
                    <DropdownMenuItem
                      onClick={() => setConfirmCancel(true)}
                      className="cursor-pointer text-xs font-medium text-red-600"
                    >
                      <XCircle className="mr-2 size-3.5" />
                      {t("cancelContract")}
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
            {/* Header: Title, Slug, & Edit Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/60 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">
                    {t("detailsTitle")}
                  </h2>
                </div>
              </div>

              {!isFreelancer &&
                contract.status === "PENDING_SIGN" &&
                !contract.signedByClient && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditContractOpen(true)}
                    className="rounded-full text-xs gap-1.5 h-8 border-border hover:bg-accent self-start sm:self-auto"
                  >
                    <FileText className="size-3.5 text-[#0069D3]" />
                    {t("editContract")}
                  </Button>
                )}
            </div>

            {/* Grid of Details: clean, monochrome, well-structured */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
              {/* Left Subcolumn */}
              <div className="space-y-4">
                {/* Job Link */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    {t("jobLabel")}
                  </span>
                  <Link
                    href={
                      isFreelancer
                        ? `/freelancer/jobs/${contract.job?.slug || contract.jobId}`
                        : `/client/jobs/${contract.jobId}`
                    }
                    className="text-sm font-bold text-[#0069D3] hover:underline mt-1 inline-block line-clamp-2"
                  >
                    {contract.job?.title || t("viewJobPosting")}
                  </Link>
                </div>

                {/* Counterparty & Parties info */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Client Info */}
                  <div className="rounded-xl border border-border/60 p-3 bg-card">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      {tRole("CLIENT")}
                    </span>
                    <Link
                      href={`/clients/${contract.clientId}`}
                      className="flex items-center gap-2 mt-2 group"
                    >
                      <Avatar className="size-7 border border-border">
                        <AvatarImage src={clientAvatarUrl || undefined} />
                        <AvatarFallback className="text-[10px] font-bold">
                          {clientName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate block">
                          {clientName}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate block">
                          ID #{contract.clientId}
                        </span>
                      </div>
                    </Link>
                  </div>

                  {/* Freelancer Info */}
                  <div className="rounded-xl border border-border/60 p-3 bg-card">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      {tRole("FREELANCER")}
                    </span>
                    <div
                      onClick={() => setProfileSheetOpen(true)}
                      className="flex items-center gap-2 mt-2 cursor-pointer group"
                    >
                      <Avatar className="size-7 border border-border">
                        <AvatarImage src={avatarUrl || undefined} />
                        <AvatarFallback className="text-[10px] font-bold">
                          {freelancerName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-foreground group-hover:text-[#0069D3] transition-colors truncate block">
                          {freelancerName}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate block">
                          ID #{contract.freelancerId}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Budget & Payment Method */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/60 p-3 bg-card">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      {t("totalAmount")}
                    </span>
                    <span className="text-base font-extrabold text-foreground mt-1 block font-mono">
                      {money(totalContractAmount)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-border/60 p-3 bg-card">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      {t("paymentMethod")}
                    </span>
                    <span className="text-xs font-semibold text-foreground mt-1 block">
                      {t("escrowMethod")}
                    </span>
                  </div>
                </div>

                {/* Platform Fee Breakdown (1% each) */}
                <div className="rounded-xl border border-border/60 p-3.5 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Platform Fee (1% each)
                    </span>
                    <span className="text-xs font-bold font-mono text-foreground">
                      {money(Number(contract.totalAmount) * 0.01)} / party
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="flex items-center justify-between border rounded-lg p-2 bg-card">
                      <span className="text-[11px] text-muted-foreground">(Client):</span>
                      {contract.clientFeeStatus === "PAID" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                          <CheckCircle2 className="size-3" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                          Unpaid
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between border rounded-lg p-2 bg-card">
                      <span className="text-[11px] text-muted-foreground">(Freelancer):</span>
                      {contract.freelancerFeeStatus === "PAID" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                          <CheckCircle2 className="size-3" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                          Unpaid
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Subcolumn: Terms, Dates & Signing Info */}
              <div className="space-y-4 flex flex-col justify-between">
                {/* Terms / Scope */}
                <div className="rounded-xl border border-border/60 p-3.5 bg-card space-y-1.5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      {t("descriptionScope")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFullContractOpen(true)}
                      className="text-[11px] font-medium text-[#0069D3] hover:underline"
                    >
                      {t("viewFullAgreement")}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-6 whitespace-pre-wrap flex-1">
                    {contract.terms || t("defaultTerms")}
                  </p>
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
                  {t("milestonesTitle")}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("milestoneCount", { count: milestones.length })}
                </span>
                {!isFreelancer && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setMilestoneToEdit(null);
                      setCreateMilestoneOpen(true);
                    }}
                    className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold h-8 px-3.5 shadow-xs"
                  >
                    <Plus className="mr-1 size-3.5" />
                    {t("addMilestone")}
                  </Button>
                )}
              </div>
            </div>

            {/* List of Milestone Cards */}
            {milestones.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-10 text-center">
                <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-[#F1F0F5] text-[#0069D3]">
                  <Flag className="size-5" />
                </div>
                <p className="text-xs font-semibold text-foreground">
                  {t("noMilestones")}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground max-w-xs">
                  {isFreelancer
                    ? t("noMilestonesFreelancer")
                    : t("noMilestonesClient")}
                </p>
                {!isFreelancer && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setMilestoneToEdit(null);
                      setCreateMilestoneOpen(true);
                    }}
                    className="mt-3 rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-medium"
                  >
                    <Plus className="mr-1 size-3" />
                    {t("addFirstMilestone")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {milestones.map((milestone: MilestoneType, index: number) => (
                  <MilestoneCard
                    key={milestone.id}
                    contractId={contract.id}
                    milestone={milestone}
                    index={index}
                    isFreelancer={isFreelancer}
                    hasOtherInProgressMilestone={
                      hasAnyInProgressMilestone &&
                      milestone.status !== "IN_PROGRESS"
                    }
                    onEdit={
                      !isFreelancer
                        ? (m) => {
                          setMilestoneToEdit(m);
                          setCreateMilestoneOpen(true);
                        }
                        : undefined
                    }
                    onDelete={
                      !isFreelancer
                        ? (m) => {
                          setMilestoneToDelete(m);
                        }
                        : undefined
                    }
                    onReview={
                      !isFreelancer
                        ? (m, sub) => {
                          setActiveReviewMilestone(m);
                          setActiveSubmission(sub);
                          setReviewOpen(true);
                        }
                        : undefined
                    }
                    onSubmitWork={
                      isFreelancer
                        ? (m) => {
                          setMilestoneToSubmit(m);
                        }
                        : undefined
                    }
                    onStartWork={
                      isFreelancer
                        ? (m) => {
                          void handleStartMilestone(m);
                        }
                        : undefined
                    }
                    onFund={
                      !isFreelancer
                        ? (m) => {
                          void handleFundMilestone(m);
                        }
                        : undefined
                    }
                    onRelease={
                      !isFreelancer
                        ? (m) => {
                          setMilestoneToRelease(m);
                        }
                        : undefined
                    }
                    onRefund={
                      !isFreelancer
                        ? (m) => {
                          setMilestoneToRefund(m);
                        }
                        : undefined
                    }
                    onOpenDispute={(m) => {
                      setDisputeMilestone(m);
                      setDisputeMode("CREATE");
                      setDisputeModalOpen(true);
                    }}
                    onViewDispute={(m) => {
                      setDisputeMilestone(m);
                      setDisputeMode("VIEW");
                      setDisputeModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Paper Contract View Card */}
          <PaperContractCard
            contract={contract}
            pdfFile={contractPdfFile}
            onViewFullTerms={() => setFullContractOpen(true)}
          />

          {/* Shared Project Files */}
          <SharedFilesSection
            contractId={contract.id}
            initialFiles={initialSharedFiles}
            currentUserId={
              isFreelancer ? contract.freelancerId : contract.clientId
            }
            clientId={contract.clientId}
            freelancerId={contract.freelancerId}
            clientName={clientName}
            freelancerName={freelancerName}
            isFreelancer={isFreelancer}
          />
        </div>
      </div>

      {/* Sheet: Create or Edit Milestone */}
      {!isFreelancer && (
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
      )}

      {/* Sheet: Edit Contract Agreement */}
      {!isFreelancer && (
        <EditContractSheet
          open={editContractOpen}
          onOpenChange={setEditContractOpen}
          contract={contract}
          minAllowedAmount={allocatedAmount}
        />
      )}

      {/* Sheet: Review Submission */}
      {!isFreelancer && activeReviewMilestone && (
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

      {/* Dialog: Submit Milestone Deliverables (Freelancer) */}
      {isFreelancer && (
        <SubmitMilestoneDialog
          contractId={contract.id}
          milestone={milestoneToSubmit}
          open={!!milestoneToSubmit}
          onOpenChange={(open) => {
            if (!open) setMilestoneToSubmit(null);
          }}
        />
      )}

      {/* Sheet: View Full Contract Agreement */}
      <Sheet open={fullContractOpen} onOpenChange={setFullContractOpen}>
        <SheetContent
          side="right"
          closeLabel={tCommon("close")}
          className="w-full sm:max-w-lg md:max-w-xl overflow-y-auto p-6 flex flex-col justify-between font-sans border-l border-border bg-background shadow-2xl z-50"
        >
          <div>
            <SheetHeader className="p-0 pb-4 border-b border-border/60">
              <div className="flex items-center gap-2 text-foreground">
                <FileText className="size-5 text-[#0069D3]" />
                <SheetTitle className="text-lg font-bold">
                  {t("agreementTitle", { id: contract.id })}
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
                    {t("totalAmount")}
                  </span>
                  <span className="font-bold text-foreground">
                    {money(totalContractAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    {t("statusLabel")}
                  </span>
                  <span className="font-semibold text-foreground">
                    {contractStatusText}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-foreground block mb-1">
                  {t("termsTitle")}
                </span>
                <div className="rounded-xl border border-border bg-card p-4 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {contract.terms || t("defaultFullTerms")}
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
              {t("signAction")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {t.rich("signHint", {
                amount: money(totalContractAmount),
                name: isFreelancer ? clientName : freelancerName,
                strong: (chunks) => (
                  <span className="font-semibold text-foreground">
                    {chunks}
                  </span>
                ),
              })}
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
                {t("confirmSign")}
              </Button>
              <AlertDialogCancel disabled={isSigning} className="w-full rounded-full text-xs">{tCommon("cancel")}</AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Confirm Complete Contract */}
      <AlertDialog open={confirmComplete} onOpenChange={setConfirmComplete}>
        <AlertDialogContent className="max-w-sm rounded-[24px] border border-border bg-background p-5 shadow-2xl font-sans">
          <div className="flex flex-col gap-3">
            <AlertDialogTitle className="text-base font-bold text-foreground">
              {t("completeContract")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {t("completeHint")}
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
                {t("markCompleted")}
              </Button>
              <AlertDialogCancel disabled={isCompleting} className="w-full rounded-full text-xs">{tCommon("cancel")}</AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Confirm Cancel Contract */}
      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent className="max-w-sm rounded-[24px] border border-border bg-background p-5 shadow-2xl font-sans">
          <div className="flex flex-col gap-3">
            <AlertDialogTitle className="text-base font-bold text-foreground">
              {t("cancelContract")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {t("cancelHint")}
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
                {t("confirmCancel")}
              </Button>
              <AlertDialogCancel disabled={isCancelling} className="w-full rounded-full text-xs">{t("goBack")}</AlertDialogCancel>
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
              {t("deleteMilestone")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {t("deleteMilestoneHint", {
                title: milestoneToDelete?.title ?? "",
              })}
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
                {t("deleteMilestone")}
              </Button>
              <AlertDialogCancel disabled={isDeletingMilestone} className="w-full rounded-full text-xs">{tCommon("cancel")}</AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Embedded Freelancer Profile Sheet */}
      {!isFreelancer && (
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
      )}

      {/* Dispute Dialog for both Client and Freelancer */}
      <DisputeDialog
        open={disputeModalOpen}
        onOpenChange={setDisputeModalOpen}
        contractId={contract.id}
        milestone={disputeMilestone}
        sharedFiles={initialSharedFiles ?? []}
        currentUserId={isFreelancer ? contract.freelancerId : contract.clientId}
        isFreelancer={isFreelancer}
        mode={disputeMode}
        onSuccess={() => {
          void queryClient.invalidateQueries({
            queryKey: ["client-contract-detail", contract.id],
          });
          void queryClient.invalidateQueries({
            queryKey: ["client-contract-milestones", contract.id],
          });
        }}
      />

      {/* Stripe Payment Dialog for Platform Fee and Escrow Milestone Funding */}
      {paymentModalConfig && (
        <StripePaymentDialog
          open={paymentModalOpen}
          onOpenChange={(open) => {
            setPaymentModalOpen(open);
            if (!open) setPaymentModalConfig(null);
          }}
          title={paymentModalConfig.title}
          description={paymentModalConfig.description}
          amount={paymentModalConfig.amount}
          clientSecret={paymentModalConfig.clientSecret}
          onSuccess={async () => {
            await queryClient.invalidateQueries({
              queryKey: ["client-contract-detail", contract.id],
            });
            await queryClient.invalidateQueries({
              queryKey: ["client-contract-milestones", contract.id],
            });
            await queryClient.invalidateQueries({
              queryKey: ["client-contracts"],
            });
          }}
        />
      )}

      {/* Dialog: Confirm Release Milestone Payment */}
      <AlertDialog
        open={!!milestoneToRelease}
        onOpenChange={(open) => !open && setMilestoneToRelease(null)}
      >
        <AlertDialogContent className="max-w-sm rounded-[24px] border border-border bg-background p-5 shadow-2xl font-sans">
          <div className="flex flex-col gap-3">
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Release Milestone Payment
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to release{" "}
              <strong className="text-foreground">
                {money(Number(milestoneToRelease?.amount ?? 0))}
              </strong>{" "}
              held in Escrow to{" "}
              <strong className="text-foreground">{freelancerName}</strong> for milestone &ldquo;{milestoneToRelease?.title}&rdquo;?
              <span className="block mt-2 font-medium text-emerald-600 dark:text-emerald-400">
                Funds will be immediately transferred to the freelancer&apos;s connected Stripe payout account.
              </span>
            </AlertDialogDescription>
            <div className="mt-2 flex flex-col gap-2">
              <Button
                disabled={isReleasingMilestone}
                onClick={() => void handleConfirmRelease()}
                className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                {isReleasingMilestone ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 size-3.5" />
                )}
                Confirm & Release Payment
              </Button>
              <AlertDialogCancel disabled={isReleasingMilestone} className="w-full rounded-full text-xs">Cancel</AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Confirm Refund Milestone Payment */}
      <AlertDialog
        open={!!milestoneToRefund}
        onOpenChange={(open) => !open && setMilestoneToRefund(null)}
      >
        <AlertDialogContent className="max-w-sm rounded-[24px] border border-border bg-background p-5 shadow-2xl font-sans">
          <div className="flex flex-col gap-3">
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Refund Milestone Escrow
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to refund{" "}
              <strong className="text-foreground">
                {money(Number(milestoneToRefund?.amount ?? 0))}
              </strong>{" "}
              for milestone &ldquo;{milestoneToRefund?.title}&rdquo;?
              <span className="block mt-2 font-medium text-rose-600 dark:text-rose-400">
                The full escrow amount will be refunded directly to your original payment card via Stripe.
              </span>
            </AlertDialogDescription>
            <div className="mt-2 flex flex-col gap-2">
              <Button
                disabled={isRefundingMilestone}
                onClick={() => void handleConfirmRefund()}
                className="w-full rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                {isRefundingMilestone ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="mr-1.5 size-3.5" />
                )}
                Confirm Refund to Card
              </Button>
              <AlertDialogCancel disabled={isRefundingMilestone} className="w-full rounded-full text-xs">Cancel</AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      {/* Dialog: 1-Click Saved Card Payment Modal */}
      {oneClickModal && (
        <Dialog
          open={oneClickModal.open}
          onOpenChange={(open) => !open && setOneClickModal(null)}
        >
          <DialogContent className="max-w-md rounded-[24px] border border-border bg-background p-6 shadow-2xl font-sans space-y-4">
            <DialogHeader className="space-y-1 text-left border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                  <ShieldCheck className="size-4" />
                </div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Confirm Escrow Deposit
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                {oneClickModal.title}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-2xl border border-border/80 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total Amount</span>
                <span className="text-lg font-extrabold text-foreground">
                  {money(oneClickModal.amount)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Funds are held safely in Escrow until you approve the final submission.
              </p>
            </div>

            {/* Saved Cards Selection */}
            {savedCardsData?.paymentMethods &&
              savedCardsData.paymentMethods.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground block">
                    Pay with Saved Card (1-Click)
                  </label>
                  <div className="space-y-2">
                    {savedCardsData.paymentMethods.map((card) => {
                      const isSelected =
                        selectedPmId === card.id ||
                        (!selectedPmId && card.isDefault);
                      return (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => setSelectedPmId(card.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${isSelected
                            ? "border-[#0069D3] bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-[#0069D3]"
                            : "border-border/80 hover:border-border bg-white dark:bg-zinc-950"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <CreditCard className="size-4 text-foreground/80 shrink-0" />
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                                {card.brand} •••• {card.last4}
                              </span>
                              <span className="block text-[11px] text-muted-foreground">
                                Exp: {String(card.expMonth).padStart(2, "0")}/
                                {card.expYear}
                              </span>
                            </div>
                          </div>
                          {card.isDefault && (
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Default
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button
                type="button"
                onClick={() => void handleConfirmOneClickPay()}
                disabled={isProcessingOneClick || isInitiatingPayment}
                className="w-full rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold h-10 shadow-sm"
              >
                {isProcessingOneClick ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-1.5 size-4" />
                )}
                Pay {money(oneClickModal.amount)} with Saved Card
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => void handlePayViaStripeCheckoutFromModal()}
                disabled={isProcessingOneClick || isInitiatingPayment}
                className="w-full rounded-full text-xs font-medium h-9 text-muted-foreground hover:text-foreground"
              >
                {isInitiatingPayment ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="mr-1.5 size-3.5" />
                )}
                Pay with Other Method (Stripe Checkout)
              </Button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => void handleOpenStripeCustomerPortal()}
                  className="text-[11px] text-muted-foreground hover:text-[#0069D3] underline underline-offset-2 transition-colors inline-flex items-center gap-1"
                >
                  Manage or change cards in Stripe Customer Portal
                  <ExternalLink className="size-2.5" />
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

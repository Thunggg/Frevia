"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { contractApiRequest, extractContractData } from "@/apiRequests/contract";
import { paymentApiRequest } from "@/apiRequests/payment";
import { ApiFail } from "@/lib/http";
import type {
  ContractDetailType,
  GetSharedFilesResponseType,
} from "@shared/types";
import { useCreateConversation } from "@/hooks/use-conversation";
import { CONTRACT_STATUSES } from "../../_components";
import { EditContractSheet } from "./edit-contract-sheet";
import { ContractDocumentPaper } from "./contract-document-paper";
import { ContractActionsSidebar } from "./contract-actions-sidebar";
import { ContractSharedFilesSidebar } from "./contract-shared-files-sidebar";
import { ContractActionDialogs } from "./contract-action-dialogs";
import {
  ManageMilestoneDialog,
  type MilestoneItemData,
} from "./manage-milestone-dialog";

export interface ContractDetailProps {
  initialContract: ContractDetailType;
  initialSharedFiles?: GetSharedFilesResponseType | null;
  basePath?: string;
}

export function ContractDetail({
  initialContract,
  initialSharedFiles,
  basePath = "/client",
}: ContractDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("contractDetail");
  const tStatus = useTranslations("contractStatus");
  const tRole = useTranslations("roleName");
  const format = useFormatter();

  const isFreelancer = basePath === "/freelancer";

  const money = (amount: number | string, currency: string = "USD") =>
    format.number(Number(amount), {
      style: "currency",
      currency: currency ? currency.toUpperCase() : "USD",
      maximumFractionDigits: 0,
    });

  // Dialog & Sheet States
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [editContractOpen, setEditContractOpen] = useState(false);
  const [fullContractOpen, setFullContractOpen] = useState(false);

  // Milestone Dialog States
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [milestoneToEdit, setMilestoneToEdit] =
    useState<MilestoneItemData | null>(null);

  // Confirmation dialogs
  const [confirmSign, setConfirmSign] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Stripe Payment dialog state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalConfig] = useState<{
    clientSecret: string;
    amount: number;
    title: string;
    description: string;
  } | null>(null);
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);

  // 1-Click Saved Card Modal State
  const [oneClickModal, setOneClickModal] = useState<{
    open: boolean;
    type: "PLATFORM_FEE";
    amount: number;
    title: string;
  } | null>(null);
  const [isProcessingOneClick, setIsProcessingOneClick] = useState(false);
  const [selectedPmId, setSelectedPmId] = useState<string>("");

  // Loading states
  const [isSigning, setIsSigning] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  // Query Saved Payment Methods
  const { data: savedCardsData, refetch: refetchSavedCards } = useQuery({
    queryKey: ["client-saved-cards"],
    queryFn: async () => {
      const res = await paymentApiRequest.getSavedPaymentMethods();
      return res.data;
    },
    enabled: !isFreelancer,
  });

  // Sync Checkout Session on URL return
  const searchParams = useSearchParams();

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");

    if (paymentStatus === "success" && sessionId) {
      const syncSession = async () => {
        try {
          await paymentApiRequest.syncCheckoutSession(sessionId);
          toastSuccess({ message: "Payment completed successfully!" });
        } catch {
          // If already processed via webhook
        } finally {
          await queryClient.invalidateQueries({
            queryKey: ["client-contract-detail", initialContract.id],
          });
          await queryClient.invalidateQueries({
            queryKey: ["client-contracts"],
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

  // Main Contract Query
  const { data: contract } = useQuery<ContractDetailType>({
    queryKey: ["client-contract-detail", initialContract.id],
    queryFn: () =>
      contractApiRequest
        .getContractDetail(initialContract.id)
        .then(extractContractData),
    initialData: initialContract,
  });

  // Shared Files / PDF Query
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

  const currentAllocatedAmount = useMemo(() => {
    return (contract.milestones || []).reduce(
      (sum, m) => sum + (Number(m.amount) || 0),
      0,
    );
  }, [contract.milestones]);

  const freelancer = contract.freelancer;
  const freelancerName =
    freelancer?.profile?.displayName || tRole("FREELANCER");
  const avatarUrl = freelancer?.profile?.avatarUrl;

  const client = contract.client;
  const clientName = client?.profile?.displayName || tRole("CLIENT");

  const contractStatusText = (
    CONTRACT_STATUSES as readonly string[]
  ).includes(contract.status)
    ? tStatus(contract.status)
    : contract.status;

  // Chat Actions
  const createConversation = useCreateConversation();

  const handleMessageCounterparty = async () => {
    const targetUserId = isFreelancer
      ? contract.clientId
      : contract.freelancerId;

    if (!targetUserId) return;

    setIsStartingChat(true);
    try {
      const conv = await createConversation.mutateAsync(targetUserId);
      if (conv?.id) {
        router.push(
          isFreelancer
            ? `/freelancer/conversations/${conv.id}`
            : `/client/conversations/${conv.id}`,
        );
      }
    } catch {
      toastError({ message: "Could not open conversation. Try again." });
    } finally {
      setIsStartingChat(false);
    }
  };

  // Sign Action
  const handleSign = async () => {
    setIsSigning(true);
    try {
      await contractApiRequest.sign(contract.id);
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["contract-shared-files", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contracts"],
      });
      toastSuccess({ message: t("signed") });
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

  // Milestone Delete Action
  const handleDeleteMilestone = async (
    milestoneId: number,
    title: string,
  ) => {
    if (
      !window.confirm(`Are you sure you want to delete milestone "${title}"?`)
    ) {
      return;
    }
    try {
      await contractApiRequest.deleteMilestone(contract.id, milestoneId);
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contract.id],
      });
      toastSuccess({ message: `Milestone "${title}" removed.` });
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to delete milestone.",
      });
    }
  };

  // Complete Action
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

  // Cancel Action
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

  // Platform Fee Trigger
  const handleStartPayPlatformFee = () => {
    const feeAmount = Number(
      contract.clientPlatformFee || contract.platformFee,
    );
    const savedCards = savedCardsData?.paymentMethods || [];

    if (savedCards.length > 0) {
      setSelectedPmId(savedCards[0]?.id || "");
      setOneClickModal({
        open: true,
        type: "PLATFORM_FEE",
        amount: feeAmount,
        title: "Pay Platform Fee (1-Click)",
      });
    } else {
      void (async () => {
        try {
          const res =
            await paymentApiRequest.createPlatformFeeCheckoutSession(
              contract.id,
            );
          if (res.data.checkoutUrl) {
            window.location.href = res.data.checkoutUrl;
          }
        } catch {
          toastError({ message: "Failed to initiate Stripe Checkout." });
        }
      })();
    }
  };

  // 1-Click Payment Confirmation
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
      }
      setOneClickModal(null);
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contracts"],
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
          await paymentApiRequest.createPlatformFeeCheckoutSession(
            contract.id,
          );
        if (res.data.checkoutUrl) window.location.href = res.data.checkoutUrl;
      }
    } finally {
      setIsProcessingOneClick(false);
    }
  };

  // Stripe Checkout Fallback
  const handlePayViaStripeCheckoutFromModal = async () => {
    if (!oneClickModal) return;
    setIsInitiatingPayment(true);
    try {
      if (oneClickModal.type === "PLATFORM_FEE") {
        const res =
          await paymentApiRequest.createPlatformFeeCheckoutSession(
            contract.id,
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

  // Customer Portal
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

  return (
    <div className="space-y-6 font-sans">
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
        <span className="font-semibold text-foreground">
          {contract.slug || `#CON-${contract.id}`}
        </span>
        <span className="text-muted-foreground/60">/</span>
        <Link
          href={`${basePath}/contracts/${encodeURIComponent(contract.slug || String(contract.id))}/milestones`}
          className="font-medium text-muted-foreground hover:text-[#0069D3] transition-colors"
        >
          Milestone
        </Link>
      </div>

      {/* ── Main 2-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Formal Contract Paper Document (Exact layout as image) */}
        <div className="lg:col-span-8 space-y-6">
          <ContractDocumentPaper
            contract={contract}
            pdfFile={contractPdfFile}
            isFreelancer={isFreelancer}
            basePath={basePath}
            onEditContract={() => setEditContractOpen(true)}
            onAddMilestone={() => {
              setMilestoneToEdit(null);
              setMilestoneModalOpen(true);
            }}
            onEditMilestone={(m) => {
              setMilestoneToEdit(m);
              setMilestoneModalOpen(true);
            }}
            onDeleteMilestone={(id, title) =>
              void handleDeleteMilestone(id, title)
            }
          />
        </div>

        {/* Right Column (4 cols): Actions & Shared Files */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          {/* Action Controls */}
          <ContractActionsSidebar
            contract={contract}
            isFreelancer={isFreelancer}
            basePath={basePath}
            pdfFile={contractPdfFile}
            isStartingChat={isStartingChat}
            isSigning={isSigning}
            onMessageCounterparty={() => void handleMessageCounterparty()}
            onOpenSignConfirm={() => setConfirmSign(true)}
            onOpenEditContract={() => setEditContractOpen(true)}
            onOpenAddMilestone={() => {
              setMilestoneToEdit(null);
              setMilestoneModalOpen(true);
            }}
            onOpenConfirmComplete={() => setConfirmComplete(true)}
            onOpenConfirmCancel={() => setConfirmCancel(true)}
            onPayPlatformFee={handleStartPayPlatformFee}
          />

          {/* Shared Files & Documents (Displayed under actions) */}
          <ContractSharedFilesSidebar
            contractId={contract.id}
            sharedFiles={sharedFilesList}
            isFreelancer={isFreelancer}
          />
        </div>
      </div>

      {/* Sheet: Edit Contract Agreement Terms (Scope & Total budget) */}
      {!isFreelancer && (
        <EditContractSheet
          open={editContractOpen}
          onOpenChange={setEditContractOpen}
          contract={contract}
          minAllowedAmount={currentAllocatedAmount}
        />
      )}

      {/* Dialog: Manage / Add / Edit Milestone */}
      {!isFreelancer && (
        <ManageMilestoneDialog
          open={milestoneModalOpen}
          onOpenChange={setMilestoneModalOpen}
          contractId={contract.id}
          totalContractAmount={Number(contract.totalAmount) || 0}
          currentAllocatedAmount={currentAllocatedAmount}
          contractExpiresAt={contract.expiresAt}
          milestoneToEdit={milestoneToEdit}
        />
      )}

      {/* All Action and Payment Dialogs */}
      <ContractActionDialogs
        contract={contract}
        isFreelancer={isFreelancer}
        clientName={clientName}
        freelancerName={freelancerName}
        avatarUrl={avatarUrl}
        freelancerId={freelancer?.id}
        money={money}
        contractStatusText={contractStatusText}
        profileSheetOpen={profileSheetOpen}
        onOpenProfileSheetChange={setProfileSheetOpen}
        fullContractOpen={fullContractOpen}
        onOpenFullContractChange={setFullContractOpen}
        confirmSign={confirmSign}
        onConfirmSignChange={setConfirmSign}
        isSigning={isSigning}
        onSign={() => void handleSign()}
        confirmComplete={confirmComplete}
        onConfirmCompleteChange={setConfirmComplete}
        isCompleting={isCompleting}
        onComplete={() => void handleComplete()}
        confirmCancel={confirmCancel}
        onConfirmCancelChange={setConfirmCancel}
        isCancelling={isCancelling}
        onCancel={() => void handleCancel()}
        paymentModalOpen={paymentModalOpen}
        onPaymentModalOpenChange={setPaymentModalOpen}
        paymentModalConfig={paymentModalConfig}
        onPaymentSuccess={async () => {
          await queryClient.invalidateQueries({
            queryKey: ["client-contract-detail", contract.id],
          });
          await queryClient.invalidateQueries({
            queryKey: ["client-contracts"],
          });
        }}
        oneClickModal={oneClickModal}
        onCloseOneClickModal={() => setOneClickModal(null)}
        savedCards={savedCardsData?.paymentMethods || []}
        selectedPmId={selectedPmId}
        onSelectPmId={setSelectedPmId}
        isProcessingOneClick={isProcessingOneClick}
        isInitiatingPayment={isInitiatingPayment}
        onConfirmOneClickPay={() => void handleConfirmOneClickPay()}
        onPayViaStripeCheckout={() =>
          void handlePayViaStripeCheckoutFromModal()
        }
        onOpenCustomerPortal={() => void handleOpenStripeCustomerPortal()}
      />
    </div>
  );
}

export { ContractDocumentPaper } from "./contract-document-paper";
export { ContractActionsSidebar } from "./contract-actions-sidebar";
export { ContractSharedFilesSidebar } from "./contract-shared-files-sidebar";
export { ManageMilestoneDialog } from "./manage-milestone-dialog";
export { ContractDetailHeader } from "./contract-detail-header";
export { ContractPartiesOverview } from "./contract-parties-overview";
export { ContractActionDialogs } from "./contract-action-dialogs";
export { PaperContractCard } from "./paper-contract-card";
export { EditContractSheet } from "./edit-contract-sheet";

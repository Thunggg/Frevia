"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { PaperContractCard } from "./paper-contract-card";
import { ContractDetailHeader } from "./contract-detail-header";
import { ContractPartiesOverview } from "./contract-parties-overview";
import { ContractActionDialogs } from "./contract-action-dialogs";

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

  const freelancer = contract.freelancer;
  const freelancerName =
    freelancer?.profile?.displayName || tRole("FREELANCER");
  const avatarUrl = freelancer?.profile?.avatarUrl;

  const client = contract.client;
  const clientName = client?.profile?.displayName || tRole("CLIENT");
  const clientAvatarUrl = client?.profile?.avatarUrl;

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
          await paymentApiRequest.createPlatformFeeCheckoutSession(contract.id);
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
          await paymentApiRequest.createPlatformFeeCheckoutSession(contract.id);
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
      {/* Top Banner / Actions Area */}
      <ContractDetailHeader
        contract={contract}
        isFreelancer={isFreelancer}
        t={t}
        tStatus={tStatus}
        isStartingChat={isStartingChat}
        onMessageCounterparty={() => void handleMessageCounterparty()}
        onOpenEditContract={() => setEditContractOpen(true)}
        onOpenFullAgreement={() => setFullContractOpen(true)}
        onOpenConfirmComplete={() => setConfirmComplete(true)}
        onOpenConfirmCancel={() => setConfirmCancel(true)}
      />

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Details & Scope */}
        <div className="lg:col-span-8 space-y-6">
          <ContractPartiesOverview
            contract={contract}
            isFreelancer={isFreelancer}
            clientName={clientName}
            clientAvatarUrl={clientAvatarUrl}
            freelancerName={freelancerName}
            avatarUrl={avatarUrl}
            money={money}
            t={t}
            tRole={tRole}
            onOpenEditContract={() => setEditContractOpen(true)}
            onOpenProfileSheet={() => setProfileSheetOpen(true)}
            onOpenFullAgreement={() => setFullContractOpen(true)}
          />
        </div>

        {/* Right Column (4 cols): Paper Contract Preview */}
        <div className="lg:col-span-4 space-y-6">
          <PaperContractCard
            contract={contract}
            pdfFile={contractPdfFile}
            onViewFullTerms={() => setFullContractOpen(true)}
          />
        </div>
      </div>

      {/* Sheet: Edit Contract Agreement */}
      {!isFreelancer && (
        <EditContractSheet
          open={editContractOpen}
          onOpenChange={setEditContractOpen}
          contract={contract}
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

export { ContractDetailHeader } from "./contract-detail-header";
export { ContractPartiesOverview } from "./contract-parties-overview";
export { ContractActionDialogs } from "./contract-action-dialogs";
export { PaperContractCard } from "./paper-contract-card";
export { EditContractSheet } from "./edit-contract-sheet";

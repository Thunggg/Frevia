"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { toast } from "@repo/ui/components/shadcn/sonner";
import { conversationKeys, useConversationSocket } from "@/hooks/use-conversation";
import { contractApiRequest, extractContractData } from "@/apiRequests/contract";
import { paymentApiRequest } from "@/apiRequests/payment";
import { useActionPermission } from "@/hooks/use-action-permission";
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
import { ContractChatPopup } from "./contract-chat-popup";
import { ContractSharedFilesSidebar } from "./contract-shared-files-sidebar";
import { ContractActionDialogs } from "./contract-action-dialogs";
import { FundContractHoldSheet } from "./fund-contract-hold-sheet";
import {
  ManageMilestoneDialog,
  type MilestoneItemData,
} from "./manage-milestone-dialog";

export interface ContractDetailProps {
  initialContract: ContractDetailType;
  initialSharedFiles?: GetSharedFilesResponseType | null;
  basePath?: string;
  currentUserId?: number | null;
  accessToken?: string | null;
  socketUrl?: string;
}

export function ContractDetail({
  initialContract,
  initialSharedFiles,
  basePath = "/client",
  currentUserId = null,
  accessToken = null,
  socketUrl = "",
}: ContractDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("contractDetail");
  const tStatus = useTranslations("contractStatus");
  const tRole = useTranslations("roleName");
  const format = useFormatter();
  const { can } = useActionPermission();
  const canViewMilestones = can("GET", "/api/contracts/:contractId/milestones");
  const canUpdateContract = can("PATCH", "/api/contracts/:id");
  const canSignContract = can("PATCH", "/api/contracts/:id/sign");
  const canCompleteContract = can("PATCH", "/api/contracts/:id/complete");
  const canCancelContract = can("PATCH", "/api/contracts/:id/cancel");
  const canRejectContract = can("PATCH", "/api/contracts/:id/reject");
  const canViewSharedFiles = can("GET", "/api/contracts/:contractId/files");

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

  // Confirmation dialogs & Hold sheet
  const [confirmSign, setConfirmSign] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [fundHoldOpen, setFundHoldOpen] = useState(false);

  // Loading states
  const [isSigning, setIsSigning] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatConversationId, setChatConversationId] = useState<number | null>(
    null,
  );

  // Sync Checkout Session on URL return
  const searchParams = useSearchParams();

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const holdStatus = searchParams.get("hold");
    const sessionId = searchParams.get("session_id");

    if ((paymentStatus === "success" || holdStatus === "success") && sessionId) {
      const syncSession = async () => {
        try {
          await paymentApiRequest.syncCheckoutSession(sessionId);
          toastSuccess({
            message:
              holdStatus === "success"
                ? "Contract escrow hold authorized! You can now sign the contract."
                : "Payment completed successfully!",
          });
        } catch {
          // If already processed via webhook
        } finally {
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ["client-contract-detail", initialContract.id],
            }),
            queryClient.invalidateQueries({
              queryKey: ["client-contracts"],
            }),
            queryClient.invalidateQueries({
              queryKey: ["client-contract-milestones", initialContract.id],
            }),
            queryClient.invalidateQueries({
              queryKey: ["client-transactions"],
            }),
            queryClient.invalidateQueries({
              queryKey: ["saved-payment-methods"],
            }),
          ]);
          const newUrl = window.location.pathname;
          window.history.replaceState({}, "", newUrl);
        }
      };
      void syncSession();
    } else if (paymentStatus === "cancelled" || holdStatus === "cancelled") {
      toastError({
        message:
          holdStatus === "cancelled"
            ? "Escrow authorization was cancelled. You can retry at any time."
            : "Payment was cancelled. You can retry at any time.",
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
    enabled: canViewSharedFiles,
    queryFn: () =>
      contractApiRequest.getSharedFiles(contract.id).then(extractContractData),
    initialData: canViewSharedFiles ? (initialSharedFiles ?? undefined) : [],
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

  const client = contract.client;
  const clientName = client?.profile?.displayName || tRole("CLIENT");
  const clientAvatarUrl = client?.profile?.avatarUrl;

  const freelancer = contract.freelancer;
  const freelancerName =
    freelancer?.profile?.displayName || tRole("FREELANCER");
  const avatarUrl = freelancer?.profile?.avatarUrl;

  const counterpartyName = isFreelancer ? clientName : freelancerName;
  const counterpartyAvatarUrl = isFreelancer
    ? clientAvatarUrl
    : avatarUrl;
  const counterpartyId = isFreelancer
    ? contract.clientId
    : contract.freelancerId;

  const contractStatusText = (
    CONTRACT_STATUSES as readonly string[]
  ).includes(contract.status)
    ? tStatus(contract.status)
    : contract.status;

  // Chat Actions
  const createConversation = useCreateConversation();
  const socketValue = useConversationSocket(
    socketUrl,
    accessToken ?? null,
    currentUserId ?? null,
  );

  const openChatWith = async (targetUserId: number | null | undefined) => {
    if (!targetUserId) return;
    setIsStartingChat(true);
    try {
      const conv = await createConversation.mutateAsync(targetUserId);
      if (conv?.id) {
        setChatConversationId(conv.id);
        setChatOpen(true);
      }
    } catch {
      toastError({ message: "Could not open conversation. Try again." });
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleMessageCounterparty = async () => {
    const targetUserId = isFreelancer
      ? contract.clientId
      : contract.freelancerId;
    await openChatWith(targetUserId);
  };

  // Real-time message notification while on contract page
  useEffect(() => {
    const socket = socketValue.socket;
    if (!socket) return;

    const handler = (payload: {
      conversationId: number;
      message: { senderId: number; message?: string };
    }) => {
      if (payload?.message?.senderId === currentUserId) return;
      if (chatOpen) return;
      const conversations = queryClient.getQueryData<
        { id: number; otherUser?: { profile?: { displayName?: string | null } } }[]
      >(conversationKeys.list());
      const conv = conversations?.find(
        (c) => c.id === payload.conversationId,
      );
      const senderName =
        conv?.otherUser?.profile?.displayName || "New message";
      toast(senderName, {
        description:
          payload?.message?.message?.slice(0, 80) || "You have a new message",
        position: "top-right",
        duration: 4000,
      });
    };

    socket.on("message:new", handler);
    return () => {
      socket.off("message:new", handler);
    };
  }, [socketValue.socket, currentUserId, chatOpen]);

  // Sign Action
  const handleSign = async () => {
    if (!canSignContract) return;
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
    if (!canCompleteContract) return;
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
    if (!canCancelContract) return;
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

  // Reject Offer Action (Freelancer)
  const handleReject = async () => {
    if (!canRejectContract) return;
    setIsRejecting(true);
    try {
      await contractApiRequest.reject(
        contract.id,
        rejectReason.trim() || undefined,
      );
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contracts"],
      });
      toastSuccess({
        message: "Contract declined. Any payment hold has been released.",
      });
      setConfirmReject(false);
      setRejectReason("");
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to decline contract.",
      });
    } finally {
      setIsRejecting(false);
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
        {canViewMilestones && (
          <>
            <span className="text-muted-foreground/60">/</span>
            <Link
              href={`${basePath}/contracts/${encodeURIComponent(contract.slug || String(contract.id))}/milestones`}
              className="font-medium text-muted-foreground hover:text-[#0069D3] transition-colors"
            >
              Milestone
            </Link>
          </>
        )}
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
            onOpenFundHold={() => setFundHoldOpen(true)}
            onOpenConfirmReject={() => setConfirmReject(true)}
          />

          {/* Shared Files & Documents (Displayed under actions) */}
          {canViewSharedFiles && (
            <ContractSharedFilesSidebar
              contractId={contract.id}
              sharedFiles={sharedFilesList}
              isFreelancer={isFreelancer}
            />
          )}
        </div>
      </div>

      {/* Sheet: Edit Contract Agreement Terms (Scope & Total budget) */}
      {!isFreelancer && canUpdateContract && (
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
          isAmountLocked={Boolean(
            milestoneToEdit &&
              contract.status === "PENDING_SIGN" &&
              contract.holdMilestoneIds?.includes(milestoneToEdit.id),
          )}
        />
      )}

      {/* Sheet: Authorize Contract Escrow Hold (Step 1) */}
      {!isFreelancer && (
        <FundContractHoldSheet
          open={fundHoldOpen}
          onOpenChange={setFundHoldOpen}
          contract={contract}
          onSuccess={async () => {
            await queryClient.invalidateQueries({
              queryKey: ["client-contract-detail", contract.id],
            });
            await queryClient.invalidateQueries({
              queryKey: ["client-contracts"],
            });
          }}
        />
      )}

      {/* Floating Messenger-style chat popup (bottom-right) */}
      <ContractChatPopup
        open={chatOpen}
        onOpenChange={setChatOpen}
        conversationId={chatConversationId}
        counterpartyId={counterpartyId}
        counterpartyName={counterpartyName}
        counterpartyAvatarUrl={counterpartyAvatarUrl}
        currentUserId={currentUserId}
        accessToken={accessToken}
        socketUrl={socketUrl}
        isStartingChat={isStartingChat}
        onOpenChat={(targetUserId) => openChatWith(targetUserId)}
      />

      {/* All Action and Confirmation Dialogs */}
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
        confirmReject={confirmReject}
        onConfirmRejectChange={setConfirmReject}
        rejectReason={rejectReason}
        onRejectReasonChange={setRejectReason}
        isRejecting={isRejecting}
        onReject={() => void handleReject()}
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
export { FundContractHoldSheet } from "./fund-contract-hold-sheet";

"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Loader2, X } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { toast } from "@repo/ui/components/shadcn/sonner";
import {
  conversationKeys,
  useConversationSocket,
  useConversations,
} from "@/hooks/use-conversation";
import { ConversationSocketContext } from "@/app/conversations/components/conversation-socket-context";
import { ChatView } from "@/app/conversations/components/chat-view";
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
  const { data: conversations = [] } = useConversations();
  const unreadMessages = (conversations ?? []).reduce(
    (sum, c) => sum + (c.unreadCount || 0),
    0,
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
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {chatOpen && chatConversationId ? (
          <div className="relative w-[360px] max-w-[calc(100vw-3rem)] h-[520px] rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Close chat"
            >
              <X className="size-4" />
            </button>
            <ConversationSocketContext.Provider value={socketValue}>
              <ChatView
                conversationId={chatConversationId}
                currentUserId={currentUserId}
              />
            </ConversationSocketContext.Provider>
          </div>
        ) : null}

        <div className="relative">
          {unreadMessages > 0 ? (
            <span className="absolute -top-1 -right-1 z-10 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 py-0.5 text-[10px] font-bold text-white shadow">
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() =>
              chatOpen
                ? setChatOpen(false)
                : void openChatWith(counterpartyId)
            }
            disabled={isStartingChat}
            className="flex size-14 items-center justify-center rounded-full border border-border bg-card shadow-lg transition-transform hover:scale-105 cursor-pointer"
            aria-label="Toggle chat"
          >
            {isStartingChat ? (
              <Loader2 className="size-5 animate-spin text-[#0069D3]" />
            ) : (
              <Avatar className="size-12">
                <AvatarImage src={counterpartyAvatarUrl || undefined} />
                <AvatarFallback className="text-xs font-bold">
                  {counterpartyName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </button>
        </div>
      </div>

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

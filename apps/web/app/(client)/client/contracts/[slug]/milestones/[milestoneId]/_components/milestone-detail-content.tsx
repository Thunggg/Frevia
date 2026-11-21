"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { contractApiRequest, extractContractData } from "@/apiRequests/contract";
import { paymentApiRequest } from "@/apiRequests/payment";
import { useActionPermission } from "@/hooks/use-action-permission";
import { ApiFail } from "@/lib/http";
import { ContractChatPopup } from "../../../_components/contract-chat-popup";
import { useCreateConversation } from "@/hooks/use-conversation";
import type {
  ContractDetailType,
  GetSubmissionResponseType,
  MilestoneFileType,
  MilestoneType,
} from "@shared/types";
import { SubmitMilestoneDialog } from "../../_components/submit-milestone-dialog";
import { ReviewSubmissionDialog } from "../../_components/review-submission-dialog";
import { MilestoneDetailHeader } from "./milestone-detail-header";
import { MilestoneDetailTabs, type MilestoneTabKey } from "./milestone-detail-tabs";
import { MilestoneOverviewTab } from "./milestone-overview-tab";
import { MilestoneSubmissionsTab } from "./milestone-submissions-tab";
import { MilestoneFilesTab } from "./milestone-files-tab";
import { MilestoneActivityTimeline } from "./milestone-activity-timeline";
import { OpenResolutionDialog } from "@/app/(client)/_components/disputes/open-resolution-dialog";
import { ResolutionDetailSheet } from "@/app/(client)/_components/disputes/resolution-detail-sheet";

interface MilestoneDetailContentProps {
  initialContract: ContractDetailType;
  initialMilestone: MilestoneType;
  initialSubmissions: GetSubmissionResponseType[];
  initialFiles: MilestoneFileType[];
  basePath?: string;
  currentUserId?: number | null;
  accessToken?: string | null;
  socketUrl?: string;
}

function MilestoneChatPopup({
  counterpartyId,
  counterpartyName,
  counterpartyAvatarUrl,
  currentUserId,
  accessToken,
  socketUrl,
}: {
  counterpartyId: number;
  counterpartyName: string;
  counterpartyAvatarUrl?: string | null;
  currentUserId?: number | null;
  accessToken?: string | null;
  socketUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const t = useTranslations("milestoneWorkspace");
  const createConversation = useCreateConversation();

  const openChat = async (targetUserId: number) => {
    setIsStartingChat(true);
    try {
      const conv = await createConversation.mutateAsync(targetUserId);
      if (conv?.id) {
        setConversationId(conv.id);
        setOpen(true);
      }
    } catch {
      toastError({ message: t("toasts.chatFailed") });
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <ContractChatPopup
      open={open}
      onOpenChange={setOpen}
      conversationId={conversationId}
      counterpartyId={counterpartyId}
      counterpartyName={counterpartyName}
      counterpartyAvatarUrl={counterpartyAvatarUrl}
      currentUserId={currentUserId}
      accessToken={accessToken}
      socketUrl={socketUrl}
      isStartingChat={isStartingChat}
      onOpenChat={openChat}
    />
  );
}

export function MilestoneDetailContent({
  initialContract,
  initialMilestone,
  initialSubmissions,
  initialFiles,
  basePath = "/client",
  currentUserId,
  accessToken,
  socketUrl,
}: MilestoneDetailContentProps) {
  const queryClient = useQueryClient();
  const t = useTranslations("milestoneWorkspace");
  const tContract = useTranslations("contractWorkspace");
  const { can, isLoading: isPermissionLoading } = useActionPermission();
  const isFreelancer = basePath === "/freelancer";
  const isClient = !isFreelancer;

  const canViewDetail = can("GET", "/api/contracts/:contractId/milestones/:id");
  const canViewSubmissions = can("GET", "/api/contracts/:contractId/milestones/:milestoneId/submissions");
  const canViewFiles = can("GET", "/api/contracts/:contractId/milestones/:milestoneId/files");

  const [activeTab, setActiveTab] = useState<MilestoneTabKey>("overview");

  // Modals state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedSubmissionToReview, setSelectedSubmissionToReview] =
    useState<GetSubmissionResponseType | null>(null);
  const [openDisputeDialog, setOpenDisputeDialog] = useState(false);
  const [viewDisputeSheet, setViewDisputeSheet] = useState(false);

  const searchParams = useSearchParams();

  // Queries
  const { data: contract } = useQuery<ContractDetailType>({
    queryKey: ["client-contract-detail", initialContract.id],
    queryFn: () =>
      contractApiRequest
        .getContractDetail(initialContract.id)
        .then(extractContractData),
    initialData: initialContract,
  });

  const { data: milestone } = useQuery<MilestoneType>({
    queryKey: ["milestone-detail", contract.id, initialMilestone.id],
    queryFn: () =>
      contractApiRequest
        .getMilestoneDetail(contract.id, initialMilestone.id)
        .then(extractContractData),
    initialData: initialMilestone,
    enabled: canViewDetail,
  });

  const { data: submissions = [] } = useQuery<GetSubmissionResponseType[]>({
    queryKey: ["milestone-submissions", contract.id, milestone.id],
    queryFn: () =>
      contractApiRequest
        .getSubmissions(contract.id, milestone.id)
        .then((res) => {
          const data = extractContractData(res);
          return Array.isArray(data) ? data : [];
        }),
    initialData: initialSubmissions,
    enabled: canViewSubmissions,
  });

  const { data: files = [] } = useQuery<MilestoneFileType[]>({
    queryKey: ["milestone-files", contract.id, milestone.id],
    queryFn: () =>
      contractApiRequest
        .getMilestoneFiles(contract.id, milestone.id)
        .then((res) => {
          const data = extractContractData(res);
          return Array.isArray(data) ? data : [];
        }),
    initialData: initialFiles,
    enabled: canViewFiles,
  });

  // Sync Stripe Checkout session on return
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");

    if (paymentStatus === "success" && sessionId) {
      const sync = async () => {
        try {
          await paymentApiRequest.syncCheckoutSession(sessionId);
          toastSuccess({
            message: t("toasts.escrowFunded"),
          });
        } catch {
          // Handled or processed via webhook
        } finally {
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ["milestone-detail", contract.id, milestone.id],
            }),
            queryClient.invalidateQueries({
              queryKey: ["client-contract-detail", contract.id],
            }),
            queryClient.invalidateQueries({
              queryKey: ["client-contract-milestones", contract.id],
            }),
            queryClient.invalidateQueries({ queryKey: ["client-transactions"] }),
            queryClient.invalidateQueries({
              queryKey: ["freelancer-transactions"],
            }),
            queryClient.invalidateQueries({ queryKey: ["transactions-summary"] }),
            queryClient.invalidateQueries({ queryKey: ["transactions"] }),
          ]);
          window.history.replaceState({}, "", window.location.pathname);
        }
      };
      void sync();
    } else if (paymentStatus === "cancelled") {
      toastError({
        message: t("toasts.checkoutCancelled"),
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, contract.id, milestone.id, queryClient, t]);

  const counterparty = isFreelancer ? contract.client : contract.freelancer;
  const counterpartyId = isFreelancer
    ? contract.clientId
    : contract.freelancerId;
  const counterpartyName =
    counterparty?.profile?.displayName || tContract("counterpart");
  const counterpartyAvatarUrl = counterparty?.profile?.avatarUrl;

  const latestSubmission = submissions.length > 0 ? submissions[0] : null;

  const contractMilestones = contract.milestones ?? [];
  const hasIncompletePreviousMilestone = contractMilestones.some(
    (m) => m.id < milestone.id && m.status !== "COMPLETED",
  );
  const hasOtherActiveMilestone = contractMilestones.some(
    (m) =>
      m.id !== milestone.id &&
      (m.status === "IN_PROGRESS" ||
        m.status === "SUBMITTED" ||
        m.status === "CHANGES_REQUESTED" ||
        m.status === "LATE" ||
        m.status === "DISPUTED"),
  );
  const startWorkBlockedReason = hasIncompletePreviousMilestone
    ? t("list.blockedPrevious")
    : hasOtherActiveMilestone
      ? t("list.blockedActive")
      : null;

  // Actions
  const handleStartWork = async () => {
    try {
      await contractApiRequest.progressMilestone(contract.id, milestone.id);
      await queryClient.invalidateQueries({
        queryKey: ["milestone-detail", contract.id, milestone.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      toastSuccess({
        message: t("toasts.startedWork", { title: milestone.title }),
      });
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("toasts.startFailed"),
      });
    }
  };

  const handleReview = (submission?: GetSubmissionResponseType) => {
    const targetSubmission = submission ?? latestSubmission ?? null;
    if (targetSubmission) {
      setSelectedSubmissionToReview(targetSubmission);
      setReviewModalOpen(true);
    }
  };

  const handleReleaseMilestone = async () => {
    try {
      await paymentApiRequest.releaseMilestone(contract.id, milestone.id);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["milestone-detail", contract.id, milestone.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["client-contract-detail", contract.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["client-contract-milestones", contract.id],
        }),
        queryClient.invalidateQueries({ queryKey: ["contracts-list"] }),
        queryClient.invalidateQueries({ queryKey: ["client-transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["freelancer-transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]);
      toastSuccess({
        message: t("toasts.releasedPayout", { title: milestone.title }),
      });
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("toasts.releaseFailed"),
      });
    }
  };

  const handleFundMilestone = async () => {
    try {
      const returnUrl = window.location.href.split("?")[0];
      const res = await paymentApiRequest.createMilestoneFundCheckoutSession(
        contract.id,
        milestone.id,
        { returnUrl },
      );
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      }
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("toasts.checkoutInitFailed"),
      });
    }
  };

  if (!isPermissionLoading && !canViewDetail) {
    return (
      <div className="space-y-4 mx-auto font-sans pb-16">
        <MilestoneDetailHeader
          contract={contract}
          milestone={milestone}
          basePath={basePath}
        />
        <div className="py-12 text-center space-y-2">
          <h3 className="text-xs font-medium text-foreground">
            {t("detail.noPermissionTitle")}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {t("detail.noPermissionDesc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mx-auto font-sans pb-16">
      {/* ── 1. Top Milestone Header (Clean, minimal, no bold/bg clutter) ── */}
      <MilestoneDetailHeader
        contract={contract}
        milestone={milestone}
        basePath={basePath}
      />

      {/* ── 2. Tabs Navigation ── */}
      <div className="space-y-4">
        <MilestoneDetailTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          submissionCount={submissions.length}
          fileCount={files.length}
          canViewSubmissions={canViewSubmissions}
          canViewFiles={canViewFiles}
        />

        {activeTab === "overview" && (
          <MilestoneOverviewTab
            contract={contract}
            milestone={milestone}
            submissions={submissions}
            isFreelancer={isFreelancer}
            startWorkBlockedReason={startWorkBlockedReason}
            onOpenDispute={() => setOpenDisputeDialog(true)}
            onViewDispute={() => setViewDisputeSheet(true)}
            onFund={() => void handleFundMilestone()}
            onStartWork={() => void handleStartWork()}
            onSubmitWork={() => setSubmitModalOpen(true)}
            onReviewSubmission={handleReview}
            onRelease={() => void handleReleaseMilestone()}
          />
        )}

        {activeTab === "submissions" && canViewSubmissions && (
          <MilestoneSubmissionsTab
            contractStatus={contract.status}
            milestone={milestone}
            submissions={submissions}
            isFreelancer={isFreelancer}
            startWorkBlockedReason={startWorkBlockedReason}
            onFund={() => void handleFundMilestone()}
            onStartWork={() => void handleStartWork()}
            onSubmitWork={() => setSubmitModalOpen(true)}
            onReviewSubmission={handleReview}
            onRelease={() => void handleReleaseMilestone()}
          />
        )}

        {activeTab === "files" && canViewFiles && (
          <MilestoneFilesTab
            contractId={contract.id}
            milestoneId={milestone.id}
            files={files}
            onFilesChanged={() => {
              void queryClient.invalidateQueries({
                queryKey: ["milestone-files", contract.id, milestone.id],
              });
            }}
            isFreelancer={isFreelancer}
          />
        )}

        {activeTab === "activity" && (
          <MilestoneActivityTimeline
            contract={contract}
            milestone={milestone}
            submissions={submissions}
            isFreelancer={isFreelancer}
          />
        )}
      </div>

      {/* ── Modals / Dialogs ── */}
      {isFreelancer && (
        <SubmitMilestoneDialog
          open={submitModalOpen}
          onOpenChange={setSubmitModalOpen}
          contractId={contract.id}
          milestone={milestone}
        />
      )}

      {isClient && selectedSubmissionToReview && (
        <ReviewSubmissionDialog
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          contractId={contract.id}
          milestoneId={milestone.id}
          milestoneTitle={milestone.title}
          milestoneAmount={Number(milestone.amount)}
          submission={selectedSubmissionToReview}
        />
      )}

      {/* Resolution Center Dialogs */}
      <OpenResolutionDialog
        open={openDisputeDialog}
        onOpenChange={setOpenDisputeDialog}
        contractId={contract.id}
        contractExpiresAt={contract.expiresAt}
        milestone={milestone}
        onCreated={() => {
          setViewDisputeSheet(true);
        }}
      />

      <ResolutionDetailSheet
        open={viewDisputeSheet}
        onOpenChange={setViewDisputeSheet}
        milestoneId={milestone.id}
        contractId={contract.id}
      />

      {/* Floating Messenger-style chat popup (bottom-right) */}
      <MilestoneChatPopup
        counterpartyId={counterpartyId}
        counterpartyName={counterpartyName}
        counterpartyAvatarUrl={counterpartyAvatarUrl}
        currentUserId={currentUserId}
        accessToken={accessToken}
        socketUrl={socketUrl}
      />
    </div>
  );
}

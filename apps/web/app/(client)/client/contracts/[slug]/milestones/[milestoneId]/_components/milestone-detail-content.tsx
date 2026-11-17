"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { contractApiRequest, extractContractData } from "@/apiRequests/contract";
import { paymentApiRequest } from "@/apiRequests/payment";
import { useActionPermission } from "@/hooks/use-action-permission";
import { ApiFail } from "@/lib/http";
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

interface MilestoneDetailContentProps {
  initialContract: ContractDetailType;
  initialMilestone: MilestoneType;
  initialSubmissions: GetSubmissionResponseType[];
  initialFiles: MilestoneFileType[];
  basePath?: string;
}

export function MilestoneDetailContent({
  initialContract,
  initialMilestone,
  initialSubmissions,
  initialFiles,
  basePath = "/client",
}: MilestoneDetailContentProps) {
  const queryClient = useQueryClient();
  const { can } = useActionPermission();
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
            message: `Escrow payment funded successfully via Stripe!`,
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
          ]);
          window.history.replaceState({}, "", window.location.pathname);
        }
      };
      void sync();
    } else if (paymentStatus === "cancelled") {
      toastError({
        message: "Stripe checkout was cancelled. You can retry at any time.",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, contract.id, milestone.id, queryClient]);

  const latestSubmission = submissions.length > 0 ? submissions[0] : null;

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
        message: `Milestone "${milestone.title}" started!`,
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
      await queryClient.invalidateQueries({
        queryKey: ["milestone-detail", contract.id, milestone.id],
      });
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
        message: `Payout transferred via Stripe for "${milestone.title}" (5% freelancer fee deducted).`,
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
            : "Failed to initiate Stripe Checkout session.",
      });
    }
  };

  const handleRefundMilestone = async () => {
    if (
      !window.confirm(
        `Request automatic refund of $${Number(milestone.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} for "${milestone.title}" to your original payment card?`,
      )
    ) {
      return;
    }
    try {
      await paymentApiRequest.refundMilestone(contract.id, milestone.id);
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
        queryClient.invalidateQueries({
          queryKey: ["client-transactions"],
        }),
      ]);
      toastSuccess({
        message: `Escrow funds refunded to your card for "${milestone.title}".`,
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

  if (!canViewDetail) {
    return (
      <div className="space-y-4 mx-auto font-sans pb-16">
        <MilestoneDetailHeader
          contract={contract}
          milestone={milestone}
          basePath={basePath}
        />
        <div className="py-12 text-center space-y-2">
          <h3 className="text-xs font-medium text-foreground">
            Không có quyền xem chi tiết milestone
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Tài khoản của bạn chưa được cấp quyền xem thông tin chi tiết milestone này.
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
            onFund={() => void handleFundMilestone()}
            onStartWork={() => void handleStartWork()}
            onSubmitWork={() => setSubmitModalOpen(true)}
            onReviewSubmission={handleReview}
            onRelease={() => void handleReleaseMilestone()}
            onRefund={() => void handleRefundMilestone()}
          />
        )}

        {activeTab === "submissions" && canViewSubmissions && (
          <MilestoneSubmissionsTab
            contractStatus={contract.status}
            milestone={milestone}
            submissions={submissions}
            isFreelancer={isFreelancer}
            onFund={() => void handleFundMilestone()}
            onStartWork={() => void handleStartWork()}
            onSubmitWork={() => setSubmitModalOpen(true)}
            onReviewSubmission={handleReview}
            onRelease={() => void handleReleaseMilestone()}
            onRefund={() => void handleRefundMilestone()}
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
    </div>
  );
}

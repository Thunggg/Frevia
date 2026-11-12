"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { contractApiRequest, extractContractData } from "@/apiRequests/contract";
import { paymentApiRequest } from "@/apiRequests/payment";
import { ApiFail } from "@/lib/http";
import type {
  ContractDetailType,
  GetSubmissionResponseType,
  MilestoneFileType,
  MilestoneType,
} from "@shared/types";
import { FundMilestoneDialog } from "../../_components/fund-milestone-dialog";
import { SubmitMilestoneDialog } from "../../_components/submit-milestone-dialog";
import { ReviewSubmissionDialog } from "../../_components/review-submission-dialog";
import { MilestoneDetailHeader } from "./milestone-detail-header";
import { MilestoneWorkflowStepper } from "./milestone-workflow-stepper";
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
  const isFreelancer = basePath === "/freelancer";
  const isClient = !isFreelancer;

  const [activeTab, setActiveTab] = useState<MilestoneTabKey>("overview");

  // Modals state
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedSubmissionToReview, setSelectedSubmissionToReview] =
    useState<GetSubmissionResponseType | null>(null);

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
  });

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* ── 1. Top Milestone Breadcrumb Header ── */}
      <MilestoneDetailHeader
        contract={contract}
        milestone={milestone}
        basePath={basePath}
      />

      {/* ── 2. Horizontal Workflow Stepper ── */}
      <MilestoneWorkflowStepper
        milestone={milestone}
        submissions={submissions}
      />

      {/* ── 3. Main Two-Column Layout (Image 1: Left 4 Tabs & Content, Right Activity) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 4 Tabs + Selected Tab Content (8 Cols) */}
        <div className="lg:col-span-12 space-y-6">
          <MilestoneDetailTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            submissionCount={submissions.length}
            fileCount={files.length}
          />

          {activeTab === "overview" && (
            <MilestoneOverviewTab
              contract={contract}
              milestone={milestone}
              submissions={submissions}
              isFreelancer={isFreelancer}
            />
          )}

          {activeTab === "submissions" && (
            <MilestoneSubmissionsTab
              contractStatus={contract.status}
              milestone={milestone}
              submissions={submissions}
              isFreelancer={isFreelancer}
              onFund={() => setFundModalOpen(true)}
              onStartWork={() => void handleStartWork()}
              onSubmitWork={() => setSubmitModalOpen(true)}
              onReviewSubmission={handleReview}
              onRelease={() => void handleReleaseMilestone()}
              onRefund={() => void handleRefundMilestone()}
            />
          )}

          {activeTab === "files" && (
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
      </div>

      {/* ── Modals / Dialogs ── */}

      {/* 1. Fund Escrow Dialog (Client) */}
      {isClient && (
        <FundMilestoneDialog
          open={fundModalOpen}
          onOpenChange={setFundModalOpen}
          contractId={contract.id}
          milestone={milestone}
        />
      )}

      {/* 2. Submit Work Dialog (Freelancer) */}
      {isFreelancer && (
        <SubmitMilestoneDialog
          open={submitModalOpen}
          onOpenChange={setSubmitModalOpen}
          contractId={contract.id}
          milestone={milestone}
        />
      )}

      {/* 3. Review Submission Dialog (Client) */}
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

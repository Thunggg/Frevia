"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { contractApiRequest, extractContractData } from "@/apiRequests/contract";
import { ApiFail } from "@/lib/http";
import type {
  ContractDetailType,
  GetSubmissionResponseType,
  MilestoneFileType,
  MilestoneType,
} from "@shared/types";
import {
  ManageMilestoneDialog,
  type MilestoneItemData,
} from "@/app/(client)/client/contracts/[slug]/_components/manage-milestone-dialog";
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
  const router = useRouter();
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
  const [editModalOpen, setEditModalOpen] = useState(false);

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

  const handleDeleteMilestone = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete milestone "${milestone.title}"?`,
      )
    ) {
      return;
    }
    try {
      await contractApiRequest.deleteMilestone(contract.id, milestone.id);
      toastSuccess({ message: `Milestone "${milestone.title}" deleted.` });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contract.id],
      });
      router.push(
        `${basePath}/contracts/${contract.slug || contract.id}/milestones`,
      );
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to delete milestone.",
      });
    }
  };

  const milestoneToEdit: MilestoneItemData = {
    id: milestone.id,
    title: milestone.title,
    description: milestone.description,
    amount: Number(milestone.amount),
    dueDate: milestone.dueDate,
    status: milestone.status,
  };

  const totalContractAmount = Number(contract.totalAmount) || 0;
  const currentAllocatedAmount = (contract.milestones || []).reduce(
    (sum, m) => sum + (Number(m.amount) || 0),
    0,
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* ── 1. Top Milestone Header ── */}
      <MilestoneDetailHeader
        contract={contract}
        milestone={milestone}
        submissionCount={submissions.length}
        basePath={basePath}
        isFreelancer={isFreelancer}
        onFund={() => setFundModalOpen(true)}
        onSubmitWork={() => setSubmitModalOpen(true)}
        onReview={() => handleReview()}
        onStartWork={() => void handleStartWork()}
        onEdit={() => setEditModalOpen(true)}
        onDelete={() => void handleDeleteMilestone()}
      />

      {/* ── 2. Horizontal Workflow Stepper ── */}
      <MilestoneWorkflowStepper
        milestone={milestone}
        submissions={submissions}
      />

      {/* ── 3. Main Two-Column Layout (Image 1: Left 4 Tabs & Content, Right Activity) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 4 Tabs + Selected Tab Content (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
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
              milestone={milestone}
              submissions={submissions}
              isFreelancer={isFreelancer}
              onSubmitWork={() => setSubmitModalOpen(true)}
              onReviewSubmission={handleReview}
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

        {/* Right Column: Activity Timeline Audit Feed (4 Cols) */}
        <div className="lg:col-span-4 space-y-5 sticky top-6">
          <MilestoneActivityTimeline
            contract={contract}
            milestone={milestone}
            submissions={submissions}
            isFreelancer={isFreelancer}
          />
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

      {/* 4. Edit Milestone Dialog (Client) */}
      {isClient && (
        <ManageMilestoneDialog
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          contractId={contract.id}
          totalContractAmount={totalContractAmount}
          currentAllocatedAmount={currentAllocatedAmount}
          contractExpiresAt={contract.expiresAt}
          milestoneToEdit={milestoneToEdit}
        />
      )}
    </div>
  );
}

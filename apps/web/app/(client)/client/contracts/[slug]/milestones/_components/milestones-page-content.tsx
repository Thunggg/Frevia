"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Clock,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { contractApiRequest, extractContractData } from "@/apiRequests/contract";
import { paymentApiRequest } from "@/apiRequests/payment";
import { useActionPermission } from "@/hooks/use-action-permission";
import { ApiFail } from "@/lib/http";
import type {
  ContractDetailType,
  GetSubmissionResponseType,
  MilestoneType,
  SharedFileType,
} from "@shared/types";
import {
  ManageMilestoneDialog,
  type MilestoneItemData,
} from "@/app/(client)/client/contracts/[slug]/_components/manage-milestone-dialog";
import { MilestoneCard } from "./milestone-card";
import { SubmitMilestoneDialog } from "./submit-milestone-dialog";
import { ReviewSubmissionDialog } from "./review-submission-dialog";
import { ContractChatPopup } from "../../_components/contract-chat-popup";
import { useCreateConversation } from "@/hooks/use-conversation";
import { OpenResolutionDialog } from "@/components/disputes/open-resolution-dialog";
import { ResolutionDetailSheet } from "@/components/disputes/resolution-detail-sheet";

export interface MilestonesPageContentProps {
  initialContract: ContractDetailType;
  initialSharedFiles?: SharedFileType[] | null;
  basePath?: string;
  currentUserId?: number | null;
  accessToken?: string | null;
  socketUrl?: string;
}

export function MilestonesPageContent({
  initialContract,
  basePath = "/client",
  currentUserId,
  accessToken,
  socketUrl,
}: MilestonesPageContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("milestoneWorkspace");
  const { can } = useActionPermission();
  const isFreelancer = basePath === "/freelancer";
  const isClient = !isFreelancer;

  const canViewMilestones = can("GET", "/api/contracts/:contractId/milestones");
  const canCreateMilestone = can("POST", "/api/contracts/:contractId/milestones");

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [milestoneToEdit, setMilestoneToEdit] =
    useState<MilestoneItemData | null>(null);

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [milestoneToSubmit, setMilestoneToSubmit] =
    useState<MilestoneType | null>(null);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewContext, setReviewContext] = useState<{
    milestone: MilestoneType;
    submission: GetSubmissionResponseType;
  } | null>(null);

  const [disputeTargetMilestone, setDisputeTargetMilestone] =
    useState<MilestoneType | null>(null);
  const [viewDisputeMilestoneId, setViewDisputeMilestoneId] = useState<
    number | null
  >(null);

  const searchParams = useSearchParams();

  // Contract Query
  const { data: contract } = useQuery<ContractDetailType>({
    queryKey: ["client-contract-detail", initialContract.id],
    queryFn: () =>
      contractApiRequest
        .getContractDetail(initialContract.id)
        .then(extractContractData),
    initialData: initialContract,
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
              queryKey: ["client-contract-milestones", contract.id],
            }),
            queryClient.invalidateQueries({
              queryKey: ["client-contract-detail", contract.id],
            }),
            queryClient.invalidateQueries({ queryKey: ["client-transactions"] }),
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
  }, [searchParams, contract.id, queryClient, t]);

  const canManageMilestones =
    isClient &&
    (contract.status === "PENDING_SIGN" ||
      contract.status === "AWAITING_PAYMENT");

  const milestones: MilestoneType[] = useMemo(() => {
    return (contract.milestones || []) as MilestoneType[];
  }, [contract.milestones]);

  const totalAmount = Number(contract.totalAmount) || 0;

  const currentAllocatedAmount = useMemo(() => {
    return milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  }, [milestones]);

  const hasInProgressMilestone = useMemo(() => {
    return milestones.some(
      (m) =>
        m.status === "IN_PROGRESS" ||
        m.status === "SUBMITTED" ||
        m.status === "CHANGES_REQUESTED" ||
        m.status === "LATE" ||
        m.status === "DISPUTED",
    );
  }, [milestones]);

  // Filtered Milestones with search & status
  const filteredMilestones = useMemo(() => {
    let list = milestones;
    if (statusFilter !== "ALL") {
      if (statusFilter === "IN_PROGRESS") {
        list = list.filter((m) => m.status === "IN_PROGRESS");
      } else if (statusFilter === "SUBMITTED") {
        list = list.filter(
          (m) => m.status === "SUBMITTED" || m.status === "CHANGES_REQUESTED",
        );
      } else if (statusFilter === "PENDING_ESCROW") {
        list = list.filter((m) => m.paymentStatus === "PENDING");
      } else if (statusFilter === "LATE") {
        list = list.filter((m) => m.status === "LATE");
      } else if (statusFilter === "COMPLETED") {
        list = list.filter((m) => m.status === "COMPLETED");
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          `mls-${m.id}`.includes(q),
      );
    }
    return list;
  }, [milestones, statusFilter, searchQuery]);

  const counterparty = isFreelancer ? contract.client : contract.freelancer;
  const counterpartyId = isFreelancer
    ? contract.clientId
    : contract.freelancerId;
  const counterpartyName = counterparty?.profile?.displayName || "Counterpart";
  const counterpartyAvatarUrl = counterparty?.profile?.avatarUrl;

  // Milestone Actions
  const handleStartWork = async (milestone: MilestoneType) => {
    try {
      await contractApiRequest.progressMilestone(contract.id, milestone.id);
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contract.id],
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

  const handleReleaseMilestone = async (milestone: MilestoneType) => {
    try {
      await paymentApiRequest.releaseMilestone(contract.id, milestone.id);
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

  const handleFundMilestone = async (target: MilestoneType) => {
    try {
      const returnUrl = window.location.href.split("?")[0];
      const res = await paymentApiRequest.createMilestoneFundCheckoutSession(
        contract.id,
        target.id,
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

  const handleRefundMilestone = async (milestone: MilestoneType) => {
    if (
      !window.confirm(
        t("toasts.refundConfirm", {
          amount: `$${Number(milestone.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
          title: milestone.title,
        }),
      )
    ) {
      return;
    }
    try {
      await paymentApiRequest.refundMilestone(contract.id, milestone.id);
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
        message: t("toasts.refunded", { title: milestone.title }),
      });
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("toasts.refundFailed"),
      });
    }
  };

  const handleDeleteMilestone = async (milestone: MilestoneType) => {
    if (
      !window.confirm(t("toasts.deleteConfirm", { title: milestone.title }))
    ) {
      return;
    }
    try {
      await contractApiRequest.deleteMilestone(contract.id, milestone.id);
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contract.id],
      });
      toastSuccess({ message: t("toasts.deleted", { title: milestone.title }) });
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("toasts.deleteFailed"),
      });
    }
  };

  const [chatOpen, setChatOpen] = useState(false);
  const [chatConversationId, setChatConversationId] = useState<number | null>(
    null,
  );
  const [isStartingChat, setIsStartingChat] = useState(false);
  const createConversation = useCreateConversation();

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
      toastError({ message: t("toasts.chatFailed") });
    } finally {
      setIsStartingChat(false);
    }
  };

  const contractCode =
    contract.slug?.startsWith("CTR-") || contract.slug?.startsWith("CON-")
      ? `#${contract.slug}`
      : `#CON-${contract.id}`;

  // Filter tabs (No loud backgrounds, subtle text tabs)
  const filterTabs = [
    { key: "ALL", label: t("tabs.all"), count: milestones.length },
    {
      key: "IN_PROGRESS",
      label: t("tabs.inProgress"),
      count: milestones.filter((m) => m.status === "IN_PROGRESS").length,
    },
    {
      key: "SUBMITTED",
      label: t("tabs.delivered"),
      count: milestones.filter(
        (m) => m.status === "SUBMITTED" || m.status === "CHANGES_REQUESTED",
      ).length,
    },
    {
      key: "COMPLETED",
      label: t("tabs.completed"),
      count: milestones.filter((m) => m.status === "COMPLETED").length,
    },
    {
      key: "PENDING_ESCROW",
      label: t("tabs.awaitingEscrow"),
      count: milestones.filter((m) => m.paymentStatus === "PENDING").length,
    },
    {
      key: "LATE",
      label: t("tabs.overdue"),
      count: milestones.filter((m) => m.status === "LATE").length,
    },
  ];

  return (
    <div className="space-y-4 font-sans mx-auto pb-16">
      {/* ── Top Bar: Breadcrumb + Add Milestone (No big title, no progress bar) ── */}
      <div className="flex items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href={`${basePath}/contracts`}
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
            <span>{t("breadcrumb.contracts")}</span>
          </Link>
          <span>/</span>
          <Link
            href={`${basePath}/contracts/${encodeURIComponent(contract.slug || String(contract.id))}`}
            className="hover:text-foreground transition-colors"
          >
            {contract.slug || contractCode}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">
            {t("breadcrumb.milestones")}
          </span>
        </div>

        {/* Action button if client can add milestone */}
        {canManageMilestones && canCreateMilestone && (
          <Button
            size="sm"
            onClick={() => {
              setMilestoneToEdit(null);
              setMilestoneModalOpen(true);
            }}
            className="rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-normal h-8 px-3.5 cursor-pointer"
          >
            <Plus className="mr-1 size-3.5" />
            {t("list.addMilestone")}
          </Button>
        )}
      </div>

      {/* ── Control Bar: Status Tabs & Search (Matching Contract List Reference Image) ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
        {/* Status Tabs Pill Bar */}
        <div className="flex h-8 items-center gap-1 overflow-x-auto rounded-full bg-[#F1F0F5] p-1 text-xs dark:bg-muted scrollbar-none">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`
                  inline-flex h-6 cursor-pointer items-center gap-1.5
                  whitespace-nowrap rounded-full px-3
                  font-medium transition-all text-xs
                  ${
                    isActive
                      ? "bg-background font-semibold text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`
                      rounded-full px-1.5 py-0 text-[10px] font-semibold leading-tight
                      ${
                        isActive
                          ? "bg-[#0069D3]/10 text-[#0069D3]"
                          : "bg-muted-foreground/15 text-muted-foreground"
                      }
                    `}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input (Matching Screenshot Height & Style) */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("list.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              h-8 w-full rounded-full
              border border-border
              bg-background py-1
              pr-3 pl-8 text-xs
              text-foreground
              placeholder:text-muted-foreground/60
              focus:border-[#0069D3]
              focus:ring-1
              focus:ring-[#0069D3]
              focus:outline-none
            "
          />
        </div>
      </div>

      {/* ── Milestones List (Clean, borderless list) ── */}
      {!canViewMilestones ? (
        <div className="py-12 text-center space-y-1.5">
          <Clock className="size-6 mx-auto text-muted-foreground" />
          <h3 className="text-xs font-medium text-foreground">
            {t("list.noPermissionTitle")}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {t("list.noPermissionDesc")}
          </p>
        </div>
      ) : filteredMilestones.length > 0 ? (
        <div className="divide-y divide-border/40">
          {filteredMilestones.map((m, idx) => {
            const hasIncompletePrevious = milestones.some(
              (prev) => prev.id < m.id && prev.status !== "COMPLETED",
            );
            const hasOtherActive = milestones.some(
              (other) =>
                other.id !== m.id &&
                (other.status === "IN_PROGRESS" ||
                  other.status === "SUBMITTED" ||
                  other.status === "CHANGES_REQUESTED" ||
                  other.status === "LATE" ||
                  other.status === "DISPUTED"),
            );
            const startWorkBlockedReason = hasIncompletePrevious
              ? t("list.blockedPrevious")
              : hasOtherActive
                ? t("list.blockedActive")
                : null;

            return (
              <MilestoneCard
                key={m.id}
                contractId={contract.id}
                contractSlug={encodeURIComponent(
                  contract.slug || String(contract.id),
                )}
                contractStatus={contract.status}
                isHeldInContract={Boolean(
                  contract.holdMilestoneIds?.includes(m.id),
                )}
                basePath={basePath}
                milestone={m}
                index={idx}
                totalMilestones={filteredMilestones.length}
                isFreelancer={isFreelancer}
                hasOtherInProgressMilestone={hasInProgressMilestone}
                startWorkBlockedReason={startWorkBlockedReason}
              onEdit={(target) => {
                setMilestoneToEdit({
                  id: target.id,
                  title: target.title,
                  description: target.description,
                  amount: Number(target.amount),
                  dueDate: target.dueDate,
                  status: target.status,
                });
                setMilestoneModalOpen(true);
              }}
              onDelete={(target) => void handleDeleteMilestone(target)}
              onFund={(target) => void handleFundMilestone(target)}
              onRelease={(target) => void handleReleaseMilestone(target)}
              onRefund={(target) => void handleRefundMilestone(target)}
              onReview={async (target) => {
                try {
                  const res = await contractApiRequest.getSubmissions(
                    contract.id,
                    target.id,
                  );
                  const data = extractContractData(res);
                  if (data && data.length > 0 && data[0]) {
                    setReviewContext({
                      milestone: target,
                      submission: data[0],
                    });
                    setReviewModalOpen(true);
                  } else {
                    router.push(
                      `${basePath}/contracts/${encodeURIComponent(contract.slug || String(contract.id))}/milestones/${target.id}`,
                    );
                  }
                } catch {
                  router.push(
                    `${basePath}/contracts/${encodeURIComponent(contract.slug || String(contract.id))}/milestones/${target.id}`,
                  );
                }
              }}
                onSubmitWork={(target) => {
                  setMilestoneToSubmit(target);
                  setSubmitModalOpen(true);
                }}
                onStartWork={(target) => void handleStartWork(target)}
                onOpenDispute={(target) => setDisputeTargetMilestone(target)}
                onViewDispute={(target) => setViewDisputeMilestoneId(target.id)}
              />
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center space-y-2">
          <Clock className="size-6 mx-auto text-muted-foreground/60" />
          <h3 className="text-xs font-medium text-foreground">
            {t("list.emptyTitle")}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {isClient ? t("list.emptyClient") : t("list.emptyFreelancer")}
          </p>
          {canManageMilestones && (
            <Button
              size="sm"
              onClick={() => {
                setMilestoneToEdit(null);
                setMilestoneModalOpen(true);
              }}
              className="rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-normal cursor-pointer mt-2"
            >
              <Plus className="mr-1 size-3.5" />
              {t("list.addFirstMilestone")}
            </Button>
          )}
        </div>
      )}

      {/* ── Dialogs & Modals ── */}
      {isClient && (
        <ManageMilestoneDialog
          open={milestoneModalOpen}
          onOpenChange={setMilestoneModalOpen}
          contractId={contract.id}
          totalContractAmount={totalAmount}
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

      {isFreelancer && (
        <SubmitMilestoneDialog
          open={submitModalOpen}
          onOpenChange={setSubmitModalOpen}
          contractId={contract.id}
          milestone={milestoneToSubmit}
        />
      )}

      {isClient && reviewContext && (
        <ReviewSubmissionDialog
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          contractId={contract.id}
          milestoneId={reviewContext.milestone.id}
          milestoneTitle={reviewContext.milestone.title}
          milestoneAmount={Number(reviewContext.milestone.amount)}
          submission={reviewContext.submission}
        />
      )}

      {/* Resolution Center Dialogs */}
      <OpenResolutionDialog
        open={Boolean(disputeTargetMilestone)}
        onOpenChange={(open) => {
          if (!open) setDisputeTargetMilestone(null);
        }}
        contractId={contract.id}
        contractExpiresAt={contract.expiresAt}
        milestone={disputeTargetMilestone}
        onCreated={(created) => {
          setViewDisputeMilestoneId(created.milestoneId);
        }}
      />

      <ResolutionDetailSheet
        open={Boolean(viewDisputeMilestoneId)}
        onOpenChange={(open) => {
          if (!open) setViewDisputeMilestoneId(null);
        }}
        milestoneId={viewDisputeMilestoneId}
        contractId={contract.id}
      />

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
    </div>
  );
}

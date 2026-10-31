"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@repo/ui/components/shadcn/sheet";
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
import { VerifiedBadge } from "@/components/verified-badge";
import { FreelancerProfileSheet } from "@/app/(client)/_components/freelancer-profile-sheet";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  MessageSquare,
  UserRound,
  X,
} from "@/components/icons";
import {
  extractProposalData,
  proposalApiRequest,
} from "@/apiRequests/proposal";
import { useCreateConversation } from "@/hooks/use-conversation";
import { ApiFail } from "@/lib/http";
import type {
  ClientProposalDetailType,
  SubmittedProposalStatusType,
} from "@shared/types";

export interface ProposalDetailSheetProps {
  proposalId: number | null;
  jobId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProposal?: {
    id: number;
    jobId?: number;
    freelancerId?: number;
    coverLetter: string;
    bidAmount: number;
    deliveryDays: number;
    status: SubmittedProposalStatusType;
    submittedAt: string | Date;
    freelancer: {
      id: number;
      displayName: string;
      avatarUrl: string | null;
      title: string | null;
      verified: boolean;
      profileId?: number | null;
    };
  } | null;
  onAccept?: (proposalId: number) => Promise<void> | void;
  onReject?: (proposalId: number) => Promise<void> | void;
}

export function ProposalDetailSheet({
  proposalId,
  jobId,
  open,
  onOpenChange,
  initialProposal,
  onAccept,
  onReject,
}: ProposalDetailSheetProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("clientProposals");
  const tRole = useTranslations("roleName");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  const money = (value: number | null) =>
    value === null
      ? tCommon("notSet")
      : format.number(value, {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        });

  const formatDate = (value: string | Date | null) =>
    value
      ? format.dateTime(new Date(value), {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : tCommon("notSet");

  const [confirmReject, setConfirmReject] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const createConversation = useCreateConversation();
  const [isStartingChat, setIsStartingChat] = useState(false);

  const proposalQuery = useQuery<ClientProposalDetailType>({
    queryKey: ["client-proposal-detail", proposalId],
    queryFn: () =>
      proposalApiRequest.getClientDetail(proposalId!).then(extractProposalData),
    enabled: open && !!proposalId,
  });

  const detail = proposalQuery.data;

  // Fallback to initialProposal while loading
  const freelancer = detail?.freelancer ?? (initialProposal?.freelancer ? {
    id: initialProposal.freelancer.id,
    email: "",
    profile: {
      displayName: initialProposal.freelancer.displayName,
      avatarUrl: initialProposal.freelancer.avatarUrl,
      freelancerProfile: {
        title: initialProposal.freelancer.title,
        idVerified: initialProposal.freelancer.verified,
      },
    },
  } : null);

  const displayName =
    freelancer?.profile?.displayName ||
    initialProposal?.freelancer.displayName ||
    tRole("FREELANCER");
  const avatarUrl =
    freelancer?.profile?.avatarUrl || initialProposal?.freelancer.avatarUrl;
  const title =
    freelancer?.profile?.freelancerProfile?.title ||
    initialProposal?.freelancer.title ||
    tRole("FREELANCER");
  const isVerified =
    freelancer?.profile?.freelancerProfile?.idVerified ??
    initialProposal?.freelancer.verified ??
    false;
  const freelancerUserId = freelancer?.id ?? initialProposal?.freelancer.id;
  const freelancerProfileId =
    initialProposal?.freelancer.profileId ?? freelancerUserId;

  const handleMessageFreelancer = async () => {
    if (!freelancerUserId) return;
    setIsStartingChat(true);
    try {
      const conv = await createConversation.mutateAsync(freelancerUserId);
      onOpenChange(false);
      router.push(`/client/conversations/${conv.id}`);
    } catch {
      onOpenChange(false);
      router.push(`/client/conversations?userId=${freelancerUserId}`);
    } finally {
      setIsStartingChat(false);
    }
  };

  const status = detail?.status || initialProposal?.status || "SUBMITTED";
  // Khách hàng còn có thể phỏng vấn / từ chối / tuyển trên hai trạng thái này.
  const isActionable = status === "SUBMITTED" || status === "INTERVIEWING";
  const bidAmount = detail?.bidAmount ?? initialProposal?.bidAmount ?? 0;
  const deliveryDays =
    detail?.deliveryDays ?? initialProposal?.deliveryDays ?? 0;
  const submittedAt =
    detail?.submittedAt || initialProposal?.submittedAt || null;
  const coverLetter =
    detail?.coverLetter || initialProposal?.coverLetter || "";
  const jobTitle = detail?.job?.title;

  const handleReject = async () => {
    if (!proposalId) return;
    setIsRejecting(true);
    try {
      if (onReject) {
        await onReject(proposalId);
      } else {
        await proposalApiRequest.reject(proposalId);
        await queryClient.invalidateQueries({
          queryKey: ["client-proposal-detail", proposalId],
        });
        await queryClient.invalidateQueries({
          queryKey: ["client-job-proposals", jobId],
        });
        toastSuccess({ message: t("rejected") });
      }
      setConfirmReject(false);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("rejectFailed"),
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleAccept = async () => {
    if (!proposalId) return;
    setIsAccepting(true);
    try {
      if (onAccept) {
        await onAccept(proposalId);
      } else {
        await proposalApiRequest.accept(proposalId);
        await queryClient.invalidateQueries({
          queryKey: ["client-proposal-detail", proposalId],
        });
        await queryClient.invalidateQueries({
          queryKey: ["client-job-proposals", jobId],
        });
        toastSuccess({ message: t("hired") });
      }
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("acceptFailed"),
      });
    } finally {
      setIsAccepting(false);
    }
  };

  // Khách hàng phản hồi và bắt đầu trao đổi/phỏng vấn.
  const handleInterview = async () => {
    if (!proposalId) return;
    setIsInterviewing(true);
    try {
      await proposalApiRequest.interview(proposalId);
      await queryClient.invalidateQueries({
        queryKey: ["client-proposal-detail", proposalId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-job-proposals", jobId],
      });
      toastSuccess({ message: t("interviewing") });
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("interviewFailed"),
      });
    } finally {
      setIsInterviewing(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          closeLabel={tCommon("close")}
          className="w-full sm:max-w-xl md:max-w-2xl overflow-hidden p-0 flex flex-col gap-0 border-l border-border bg-background shadow-2xl z-50 font-sans"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{t("sheetTitle", { id: proposalId ?? "" })}</SheetTitle>
            <SheetDescription>{t("sheetDescription")}</SheetDescription>
          </SheetHeader>

          {/* Top Header Bar */}
          <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold text-foreground">
                {t("proposalOf", { name: displayName })}
              </h2>
            </div>

            {submittedAt && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                <span>{formatDate(submittedAt)}</span>
              </p>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Freelancer Header Row */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-border/60">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setProfileSheetOpen(true)}
              >
                <Avatar className="size-12 rounded-full border border-border/60 bg-muted">
                  <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                  <AvatarFallback className="text-xs font-bold text-foreground">
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-foreground group-hover:text-[#0069D3] transition-colors">
                      {displayName}
                    </h3>
                    {isVerified && <VerifiedBadge size="xs" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {freelancerUserId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full h-8 px-3 text-xs gap-1.5 border-border/80 hover:bg-muted cursor-pointer"
                    disabled={isStartingChat}
                    onClick={() => void handleMessageFreelancer()}
                  >
                    {isStartingChat ? (
                      <Loader2 className="size-3.5 animate-spin text-[#0069D3]" />
                    ) : (
                      <MessageSquare className="size-3.5 text-[#0069D3]" />
                    )}
                    <span>
                      {isStartingChat ? t("opening") : t("message")}
                    </span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full h-8 px-3 text-xs gap-1 border-border/80 hover:bg-muted cursor-pointer"
                  onClick={() => setProfileSheetOpen(true)}
                >
                  <UserRound className="size-3.5 text-muted-foreground" />
                  <span>{t("profile")}</span>
                </Button>
              </div>
            </div>

            {/* Key Proposal Metrics - Minimal & Uncluttered (No nested boxes) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-5 border-b border-border/60">
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <DollarSign className="size-3.5 text-muted-foreground" />
                  {t("proposedBid")}
                </p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {money(bidAmount)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3.5 text-muted-foreground" />
                  {t("deliveryTime")}
                </p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {t("deliveryDays", { count: deliveryDays })}
                </p>
              </div>

              {jobTitle && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("appliedFor")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-foreground truncate" title={jobTitle}>
                    {jobTitle}
                  </p>
                </div>
              )}
            </div>

            {/* Cover Letter - Clean Text Typography (No heavy box or background) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("coverLetterHeading")}
              </h4>
              <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans">
                {coverLetter || t("noCoverLetter")}
              </div>
            </div>
          </div>

          {/* Action Footer Bar */}
          {isActionable ? (
            <div className="border-t border-border/80 bg-background px-6 py-3.5 flex items-center justify-between gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 px-4 h-9 text-xs font-semibold cursor-pointer"
                onClick={() => setConfirmReject(true)}
                disabled={isAccepting || isRejecting || isInterviewing}
              >
                <X className="mr-1.5 size-3.5" />
                {t("reject")}
              </Button>

              <div className="flex items-center gap-2 ml-auto">
                {status === "SUBMITTED" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-[#0069D3]/40 text-[#0069D3] hover:bg-[#D0E1F8]/40 px-4 h-9 text-xs font-semibold cursor-pointer"
                    onClick={() => void handleInterview()}
                    disabled={isAccepting || isRejecting || isInterviewing}
                  >
                    {isInterviewing ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <MessageSquare className="mr-1.5 size-3.5" />
                    )}
                    {t("interview")}
                  </Button>
                ) : null}

                <Button
                  size="sm"
                  className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white px-5 h-9 text-xs font-semibold shadow-xs cursor-pointer"
                  onClick={() => void handleAccept()}
                  disabled={isAccepting || isRejecting || isInterviewing}
                >
                  {isAccepting ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <Check className="mr-1.5 size-3.5" />
                  )}
                  {t("hire")}
                </Button>
              </div>
            </div>
          ) : null}

          {/* Đề xuất đã được tuyển: hợp đồng được tạo tự động khi tuyển. */}
          {status === "HIRED" ? (
            <div className="border-t border-border/80 bg-background px-6 py-3.5 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {t("hiredHint")}
              </p>
              <Button
                asChild
                size="sm"
                className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white px-5 h-9 text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Link href="/client/contracts">
                  <FileText className="mr-1.5 size-3.5" />
                  {t("viewContract")}
                </Link>
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={confirmReject} onOpenChange={setConfirmReject}>
        <AlertDialogContent className="max-w-sm rounded-[24px] border border-border bg-background p-5 shadow-2xl font-sans">
          <div className="flex flex-col gap-3">
            <div className="px-1">
              <AlertDialogTitle className="text-base font-bold text-foreground">
                {t("rejectTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1 text-xs text-muted-foreground leading-normal">
                {t("notSelectedHint")}
              </AlertDialogDescription>
            </div>

            <div className="mt-2 flex flex-col gap-2">
              <button
                type="button"
                disabled={isRejecting}
                onClick={(event) => {
                  event.preventDefault();
                  void handleReject();
                }}
                className="group flex w-full items-center justify-between rounded-full px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 cursor-pointer transition-colors outline-none disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  {isRejecting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <X className="size-3.5" />
                  )}
                  <span className="text-xs font-semibold">
                    {t("rejectTitle")}
                  </span>
                </div>
                <ChevronRight className="size-3.5 opacity-60" />
              </button>

              <AlertDialogCancel asChild>
                <button
                  type="button"
                  disabled={isRejecting}
                  className="flex w-full items-center justify-center rounded-full px-4 py-2 bg-muted/60 hover:bg-muted text-foreground text-xs font-medium cursor-pointer transition-colors outline-none border-0"
                >
                  {tCommon("cancel")}
                </button>
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Embedded Freelancer Profile Sheet */}
      <FreelancerProfileSheet
        open={profileSheetOpen}
        onOpenChange={setProfileSheetOpen}
        profileId={freelancerProfileId ?? null}
        initialData={{
          displayName,
          avatarUrl: avatarUrl ?? null,
          title,
          freelancerId: freelancerUserId,
        }}
      />
    </>
  );
}

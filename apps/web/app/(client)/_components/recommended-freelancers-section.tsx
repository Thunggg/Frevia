"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  Eye,
  Loader2,
  MessageSquare,
  RefreshCw,
  UserRound,
} from "@/components/icons";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Button } from "@repo/ui/components/shadcn/button";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import type {
  RecommendationComponentsType,
  RecommendedFreelancerType,
} from "@shared/types";
import recommendationApiRequest from "@/apiRequests/recommendation";
import { useActionPermission } from "@/hooks/use-action-permission";
import { useCreateConversation } from "@/hooks/use-conversation";
import { RecommendationExplanationDialog } from "@/app/(freelancer)/_components/recommendation-explanation-dialog";
import { FreelancerProfileSheet } from "./freelancer-profile-sheet";

type RecommendedFreelancersSectionProps = {
  jobId: number;
  jobTitle: string;
  jobStatus?: string;
  limit?: number;
};

type ExplanationModalState = {
  open: boolean;
  recommendationId: number | null;
  candidateName: string;
  components?: RecommendationComponentsType;
  matchScore?: number;
};

const MAX_VISIBLE_SKILLS = 5;

function RecommendedFreelancersSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-border bg-card p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-14 rounded-md" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Khối hiển thị danh sách ứng viên phù hợp do AI gợi ý cho một Job của Client.
 */
export function RecommendedFreelancersSection({
  jobId,
  jobTitle,
  jobStatus,
  limit = 10,
}: RecommendedFreelancersSectionProps) {
  const router = useRouter();
  const t = useTranslations("recommendation");
  const { can } = useActionPermission();

  const canViewRecommendedFreelancers = can(
    "GET",
    "/api/recommendations/freelancers",
  );
  const canViewExplanation = can(
    "GET",
    "/api/recommendations/:id/explanation",
  );
  const canCreateConversation = can("POST", "/api/conversations");

  const createConversation = useCreateConversation();
  const [messagingUserId, setMessagingUserId] = useState<number | null>(null);

  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] =
    useState<RecommendedFreelancerType | null>(null);

  const [explanationModal, setExplanationModal] =
    useState<ExplanationModalState>({
      open: false,
      recommendationId: null,
      candidateName: "",
    });

  const isClosedFinal =
    jobStatus === "CANCELLED" || jobStatus === "COMPLETED";

  const recommendedQuery = useQuery({
    queryKey: ["recommended-freelancers", jobId, limit],
    enabled: canViewRecommendedFreelancers && !isClosedFinal,
    queryFn: async () => {
      const res = await recommendationApiRequest.getRecommendedFreelancers(
        jobId,
        limit,
      );
      return res.data?.data ?? [];
    },
  });

  if (!canViewRecommendedFreelancers || isClosedFinal) {
    return null;
  }

  const candidates = recommendedQuery.data ?? [];

  const handleOpenExplanation = (candidate: RecommendedFreelancerType) => {
    setExplanationModal({
      open: true,
      recommendationId: candidate.recommendationId,
      candidateName:
        candidate.displayName || candidate.title || jobTitle,
      components: candidate.components,
      matchScore: candidate.score,
    });
  };

  const handleOpenProfile = (candidate: RecommendedFreelancerType) => {
    setSelectedCandidate(candidate);
    setProfileSheetOpen(true);
  };

  const handleMessageCandidate = async (candidate: RecommendedFreelancerType) => {
    if (!canCreateConversation || messagingUserId !== null) return;
    setMessagingUserId(candidate.userId);
    try {
      const conv = await createConversation.mutateAsync(candidate.userId);
      router.push(`/client/conversations/${conv.slug ?? conv.id}`);
    } catch {
      router.push(`/client/conversations?userId=${candidate.userId}`);
    } finally {
      setMessagingUserId(null);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-semibold text-foreground">
              {t("recommendedFreelancersTitle")}
            </h2>
            {!recommendedQuery.isLoading && candidates.length > 0 && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                {candidates.length}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("recommendedFreelancersDesc")}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={recommendedQuery.isFetching}
          onClick={() => void recommendedQuery.refetch()}
          className="h-8 rounded-lg px-3 text-xs font-medium self-start sm:self-auto cursor-pointer gap-1.5"
        >
          <RefreshCw className="size-3.5" />
          <span>{t("refreshRecommendations")}</span>
        </Button>
      </div>

      {/* Content */}
      {recommendedQuery.isLoading ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {t("loadingRecommendedFreelancers")}
          </p>
          <RecommendedFreelancersSkeleton />
        </div>
      ) : recommendedQuery.isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-sm font-medium text-foreground">
            {t("loadRecommendedFreelancersFailed")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void recommendedQuery.refetch()}
            className="mt-3 h-8 rounded-lg text-xs cursor-pointer"
          >
            {t("retry")}
          </Button>
        </div>
      ) : candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
          <UserRound className="size-8 text-muted-foreground mb-2.5" />
          <p className="text-sm font-semibold text-foreground">
            {t("emptyRecommendedFreelancersTitle")}
          </p>
          <p className="mt-1 max-w-md text-xs text-muted-foreground leading-relaxed">
            {t("emptyRecommendedFreelancersDesc")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {candidates.map((candidate) => {
            const name = candidate.displayName || t("freelancerFallback");
            const scorePercent = Math.round(candidate.score * 100);
            const skillsPercent = Math.round(
              candidate.components.skills * 100,
            );
            const semanticPercent = Math.round(
              candidate.components.semantic * 100,
            );
            const visibleSkills = candidate.skills.slice(0, MAX_VISIBLE_SKILLS);
            const extraSkillsCount = Math.max(
              0,
              candidate.skills.length - visibleSkills.length,
            );
            const canClickExplanation = Boolean(
              candidate.recommendationId && canViewExplanation,
            );
            const isMessaging = messagingUserId === candidate.userId;

            return (
              <div
                key={candidate.profileId}
                className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 space-y-3"
              >
                <div className="space-y-3">
                  {/* Top Row: Avatar + Name + Match Badge */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div
                      onClick={() => handleOpenProfile(candidate)}
                      className="flex items-center gap-3 min-w-0 cursor-pointer"
                    >
                      <Avatar className="size-10 rounded-full shrink-0 border border-border">
                        <AvatarImage
                          src={candidate.avatarUrl ?? undefined}
                          alt={name}
                        />
                        <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                          {name.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {candidate.title || t("freelancerFallback")}
                        </p>
                      </div>
                    </div>

                    {/* Match Score Badge */}
                    <button
                      type="button"
                      disabled={!canClickExplanation}
                      onClick={() => {
                        if (canClickExplanation) {
                          handleOpenExplanation(candidate);
                        }
                      }}
                      className={`inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground shrink-0 ${
                        canClickExplanation
                          ? "hover:bg-muted cursor-pointer"
                          : ""
                      }`}
                    >
                      <span className="tabular-nums">
                        {t("matchScore", { score: scorePercent })}
                      </span>
                      {canClickExplanation && (
                        <span className="text-[11px] text-muted-foreground underline">
                          {t("details")}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Quick Sub-scores */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span>
                      {t("skillsMatch")}:{" "}
                      <strong className="text-foreground font-semibold tabular-nums">
                        {skillsPercent}%
                      </strong>
                    </span>
                    <span className="text-muted-foreground/40">•</span>
                    <span>
                      {t("semanticMatch")}:{" "}
                      <strong className="text-foreground font-semibold tabular-nums">
                        {semanticPercent}%
                      </strong>
                    </span>
                  </div>

                  {/* Skills Chips */}
                  {visibleSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {visibleSkills.map((skill) => (
                        <span
                          key={skill.name}
                          className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {skill.name}
                        </span>
                      ))}
                      {extraSkillsCount > 0 && (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {t("moreSkills", { count: extraSkillsCount })}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenProfile(candidate)}
                    className="h-8 rounded-lg px-3 text-xs font-medium cursor-pointer gap-1.5"
                  >
                    <Eye className="size-3.5" />
                    <span>{t("viewProfile")}</span>
                  </Button>

                  {canCreateConversation && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={isMessaging}
                      onClick={() => void handleMessageCandidate(candidate)}
                      className="h-8 rounded-lg bg-[#0069D3] hover:bg-[#005bb8] text-white px-3 text-xs font-medium cursor-pointer gap-1.5"
                    >
                      {isMessaging ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <MessageSquare className="size-3.5" />
                      )}
                      <span>{t("messageCandidate")}</span>
                    </Button>
                  )}

                  {canClickExplanation && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenExplanation(candidate)}
                      className="h-8 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground ml-auto cursor-pointer"
                    >
                      {t("details")}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Match Explanation Dialog */}
      <RecommendationExplanationDialog
        open={explanationModal.open}
        onOpenChange={(open) =>
          setExplanationModal((prev) => ({ ...prev, open }))
        }
        recommendationId={explanationModal.recommendationId}
        jobTitle={explanationModal.candidateName}
        components={explanationModal.components}
        matchScore={explanationModal.matchScore}
        variant="freelancer"
      />

      {/* Freelancer Profile Sheet */}
      <FreelancerProfileSheet
        open={profileSheetOpen}
        onOpenChange={setProfileSheetOpen}
        profileId={selectedCandidate?.userId ?? null}
        initialData={
          selectedCandidate
            ? {
                displayName: selectedCandidate.displayName,
                avatarUrl: selectedCandidate.avatarUrl,
                title: selectedCandidate.title,
                freelancerId: selectedCandidate.userId,
              }
            : undefined
        }
      />
    </section>
  );
}

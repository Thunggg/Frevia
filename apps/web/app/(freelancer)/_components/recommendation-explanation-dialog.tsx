"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  CheckCircle2,
  InfoIcon,
  Loader2,
} from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import type {
  RecommendationComponentsType,
  RecommendationExplanationType,
} from "@shared/types";
import recommendationApiRequest from "@/apiRequests/recommendation";

type RecommendationExplanationDialogProps = {
  recommendationId: number | null;
  jobTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  components?: RecommendationComponentsType;
  matchScore?: number;
};

export function RecommendationExplanationDialog({
  recommendationId,
  jobTitle,
  open,
  onOpenChange,
  components,
  matchScore,
}: RecommendationExplanationDialogProps) {
  const t = useTranslations("recommendation");
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] =
    useState<RecommendationExplanationType | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    if (!open || !recommendationId) {
      setExplanation(null);
      setFeedbackSent(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    recommendationApiRequest
      .getExplanation(recommendationId)
      .then((res) => {
        if (isMounted) {
          setExplanation(res.data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setExplanation(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open, recommendationId]);

  const handleFeedback = async (type: "SHORTLIST" | "DISMISS") => {
    if (!recommendationId || feedbackSent || feedbackLoading) return;
    setFeedbackLoading(true);
    try {
      await recommendationApiRequest.submitFeedback(recommendationId, type);
      setFeedbackSent(true);
    } catch {
      // ignore
    } finally {
      setFeedbackLoading(false);
    }
  };

  const scorePercent =
    typeof matchScore === "number" ? Math.round(matchScore * 100) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-[28px] p-6 font-sans">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
            {t("matchDetailsTitle")}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
            {jobTitle}
          </DialogDescription>
        </DialogHeader>

        {/* Overall Score & Component Breakdown */}
        {components && (
          <div className="mt-4 rounded-2xl border border-border bg-accent/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-foreground">
                {t("matchDetailsDesc")}
              </span>
              {scorePercent !== null && (
                <span className="inline-flex items-center rounded-full bg-[#eaf8df] dark:bg-[#4fae2e]/15 border border-[#4fae2e]/30 px-3 py-1 text-xs font-bold text-[#2d6e1a] dark:text-[#7ad75d]">
                  {t("matchScore", { score: scorePercent })}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-1">
              <div className="rounded-xl bg-card p-2.5 border border-border/50 text-center">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {t("skillsMatch")}
                </p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {Math.round(components.skills * 100)}%
                </p>
              </div>

              <div className="rounded-xl bg-card p-2.5 border border-border/50 text-center">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {t("experienceMatch")}
                </p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {Math.round(components.experience * 100)}%
                </p>
              </div>

              <div className="rounded-xl bg-card p-2.5 border border-border/50 text-center">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {t("budgetMatch")}
                </p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {Math.round(components.budget * 100)}%
                </p>
              </div>

              <div className="rounded-xl bg-card p-2.5 border border-border/50 text-center">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {t("semanticMatch")}
                </p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {Math.round(components.semantic * 100)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Explanation / Claims */}
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-[#4fae2e]" />
              <p className="text-xs">{t("loadingRecommendations")}</p>
            </div>
          ) : explanation ? (
            <>
              {explanation.summary && (
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-foreground mb-1">
                    {t("summaryTitle")}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {explanation.summary}
                  </p>
                </div>
              )}

              {explanation.claims && explanation.claims.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("matchedRequirements")}
                  </p>
                  <div className="space-y-2">
                    {explanation.claims.map((claim, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl border p-3 text-xs leading-relaxed transition-all ${
                          claim.verdict === "hit"
                            ? "border-[#4fae2e]/25 bg-[#eaf8df]/40 dark:bg-[#4fae2e]/10"
                            : claim.verdict === "missing"
                              ? "border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20"
                              : "border-border bg-card"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {claim.verdict === "hit" ? (
                            <CheckCircle2 className="size-4 shrink-0 text-[#3f9225] dark:text-[#7ad75d] mt-0.5" />
                          ) : claim.verdict === "missing" ? (
                            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                          ) : (
                            <InfoIcon className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                          )}
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">
                              {claim.statement}
                            </p>
                            {claim.evidence && (
                              <p className="text-[11px] text-muted-foreground italic bg-background/50 rounded-md p-1.5 border border-border/40">
                                <span className="font-semibold not-italic">
                                  {t("evidence")}{" "}
                                </span>
                                "{claim.evidence}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              {t("matchDetailsDesc")}
            </div>
          )}
        </div>

        {/* User Feedback Row */}
        {recommendationId && (
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs text-muted-foreground font-medium">
              {feedbackSent ? t("feedbackThanks") : t("feedbackHelpful")}
            </span>
            {!feedbackSent ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={feedbackLoading}
                  onClick={() => handleFeedback("SHORTLIST")}
                  className="rounded-full text-xs h-8 px-3 text-[#2d6e1a] hover:bg-[#eaf8df] dark:text-[#7ad75d] dark:hover:bg-[#4fae2e]/15 cursor-pointer"
                >
                  {t("helpful")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={feedbackLoading}
                  onClick={() => handleFeedback("DISMISS")}
                  className="rounded-full text-xs h-8 px-3 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {t("notHelpful")}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

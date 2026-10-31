"use client";

import { contractApi } from "@/apiRequests/contract";
import { reviewApi } from "@/apiRequests/review";
import { ApiFail } from "@/lib/http";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { ContractDetailType, ReviewType } from "@shared/types";
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  Loader2,
  MessageSquareReply,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";

const initialBreakdown = { quality: "5", communication: "5", deadlines: "5" };
const BREAKDOWN_KEYS: Record<keyof typeof initialBreakdown, string> = {
  quality: "breakdownQuality",
  communication: "breakdownCommunication",
  deadlines: "breakdownDeadlines",
};

/**
 * Lỗi từ ApiFail đi qua proxy BFF đã được dịch sẵn (error.details[].message
 * chứa key i18n), nên GIỮ NGUYÊN. Mọi lỗi khác (TypeError khi mất mạng...) là
 * text tiếng Anh do runtime sinh ra nên trả về fallback đã dịch.
 */
function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiFail) {
    return error.response.error.details?.[0]?.message ?? error.message;
  }
  return fallback;
}

function reviewUserName(
  review: ReviewType,
  key: "reviewer" | "reviewee",
  fallback: string,
) {
  return review[key].profile?.displayName?.trim() || fallback;
}

function responseUserName(review: ReviewType, fallback: string) {
  return review.response?.user.profile?.displayName?.trim() || fallback;
}

function contractUserName(
  contract: ContractDetailType,
  key: "client" | "freelancer",
  fallback: string,
) {
  return contract[key].profile?.displayName?.trim() || fallback;
}

function ReviewSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-4" aria-label={label}>
      {[0, 1].map((item) => (
        <div key={item} className="rounded-xl border border-border p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-14" />
          </div>
          <Skeleton className="mt-5 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function ReviewManager({ userId }: { userId: number }) {
  const searchParams = useSearchParams();
  const t = useTranslations("reviewManager");
  const tSettings = useTranslations("clientProfileSettings");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  // Bọc trong useCallback để effect bên dưới có thể phụ thuộc mà không lặp vô hạn.
  const toMessage = useCallback(
    (error: unknown) => errorMessage(error, tSettings("somethingWentWrong")),
    [tSettings],
  );

  const memberFallback = t("memberFallback");
  const breakdownLabel = (key: string) =>
    key in BREAKDOWN_KEYS
      ? t(BREAKDOWN_KEYS[key as keyof typeof BREAKDOWN_KEYS])
      : key;
  const formatDate = (value: string | Date) =>
    format.dateTime(new Date(value), {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const requestedContractId = Number(searchParams.get("contractId"));
  const [contracts, setContracts] = useState<ContractDetailType[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [contractsError, setContractsError] = useState<string | null>(null);
  const [contractId, setContractId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [breakdown, setBreakdown] = useState(initialBreakdown);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [responseReviewId, setResponseReviewId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");
  const [editingResponseId, setEditingResponseId] = useState<number | null>(
    null,
  );
  const [deleteReviewId, setDeleteReviewId] = useState<number | null>(null);
  const [deleteResponseReviewId, setDeleteResponseReviewId] = useState<
    number | null
  >(null);
  const [pending, setPending] = useState<string | null>(null);

  const selectedContract =
    contracts.find((contract) => contract.id === contractId) ?? null;
  const ownReview =
    reviews.find((review) => review.reviewerId === userId) ?? null;
  const counterpart = selectedContract
    ? selectedContract.clientId === userId
      ? contractUserName(selectedContract, "freelancer", memberFallback)
      : contractUserName(selectedContract, "client", memberFallback)
    : null;

  const replaceReview = (review: ReviewType) =>
    setReviews((current) =>
      current.map((item) => (item.id === review.id ? review : item)),
    );

  const resetReviewForm = () => {
    setEditingId(null);
    setRating("5");
    setComment("");
    setBreakdown(initialBreakdown);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadCompletedContracts() {
      setContractsLoading(true);
      setContractsError(null);
      try {
        const response = await contractApi.listCompleted();
        if (cancelled) return;
        setContracts(response.data.data);

        const requestedContract = Number.isInteger(requestedContractId)
          ? response.data.data.find(
              (contract) => contract.id === requestedContractId,
            )
          : null;
        if (requestedContract) {
          setContractId(requestedContract.id);
          setPending("load");
          try {
            const reviewResponse = await reviewApi.list(requestedContract.id);
            if (cancelled) return;
            setReviews(reviewResponse.data);
          } catch (error) {
            if (!cancelled) setReviewsError(toMessage(error));
          }
        }
      } catch (error) {
        if (!cancelled) setContractsError(toMessage(error));
      } finally {
        if (!cancelled) {
          setContractsLoading(false);
          setPending(null);
        }
      }
    }

    void loadCompletedContracts();
    return () => {
      cancelled = true;
    };
  }, [requestedContractId, toMessage]);

  const loadReviews = async (nextContractId: number) => {
    setContractId(nextContractId);
    setReviews([]);
    setReviewsError(null);
    resetReviewForm();
    setExpandedId(null);
    setResponseReviewId(null);
    setPending("load");
    try {
      const response = await reviewApi.list(nextContractId);
      setReviews(response.data);
    } catch (error) {
      const message = toMessage(error);
      setReviewsError(message);
      toastError({ message });
    } finally {
      setPending(null);
    }
  };

  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!contractId) return;

    const body = {
      overallRating: Number(rating),
      breakdown: {
        quality: Number(breakdown.quality),
        communication: Number(breakdown.communication),
        deadlines: Number(breakdown.deadlines),
      },
      comment: comment.trim() || null,
    };
    setPending(editingId ? `review-${editingId}` : "create");
    try {
      if (editingId) {
        const response = await reviewApi.update(editingId, body);
        replaceReview(response.data);
        toastSuccess({ message: t("reviewUpdated") });
      } else {
        const response = await reviewApi.create(contractId, body);
        setReviews((current) => [response.data, ...current]);
        toastSuccess({
          message: t("reviewSubmitted"),
        });
      }
      resetReviewForm();
    } catch (error) {
      toastError({ message: toMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const startEdit = (review: ReviewType) => {
    setEditingId(review.id);
    setRating(String(review.overallRating));
    setComment(review.comment ?? "");
    setBreakdown({
      quality: String(review.breakdown?.quality ?? review.overallRating),
      communication: String(
        review.breakdown?.communication ?? review.overallRating,
      ),
      deadlines: String(review.breakdown?.deadlines ?? review.overallRating),
    });
    document
      .getElementById("review-editor")
      ?.scrollIntoView({ block: "start" });
  };

  const removeReview = async () => {
    if (!deleteReviewId) return;
    setPending(`delete-${deleteReviewId}`);
    try {
      await reviewApi.remove(deleteReviewId);
      setReviews((current) =>
        current.filter((item) => item.id !== deleteReviewId),
      );
      if (editingId === deleteReviewId) resetReviewForm();
      toastSuccess({ message: t("reviewDeleted") });
      setDeleteReviewId(null);
    } catch (error) {
      toastError({ message: toMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const viewDetail = async (reviewId: number) => {
    if (expandedId === reviewId) {
      setExpandedId(null);
      return;
    }
    setPending(`detail-${reviewId}`);
    try {
      const response = await reviewApi.detail(reviewId);
      replaceReview(response.data);
      setExpandedId(reviewId);
    } catch (error) {
      toastError({ message: toMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const submitResponse = async (event: FormEvent, review: ReviewType) => {
    event.preventDefault();
    const responseId = review.response?.id;
    setPending(`response-${review.id}`);
    try {
      const response =
        responseId && editingResponseId === responseId
          ? await reviewApi.updateResponse(responseId, { responseText })
          : await reviewApi.respond(review.id, { responseText });
      replaceReview({ ...review, response: response.data });
      setResponseReviewId(null);
      setEditingResponseId(null);
      setResponseText("");
      toastSuccess({
        message: responseId ? t("responseUpdated") : t("responsePosted"),
      });
    } catch (error) {
      toastError({ message: toMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const removeResponse = async (review: ReviewType) => {
    if (!review.response) return;
    setPending(`response-delete-${review.id}`);
    try {
      await reviewApi.removeResponse(review.response.id);
      replaceReview({ ...review, response: null });
      setDeleteResponseReviewId(null);
      toastSuccess({ message: t("responseDeleted") });
    } catch (error) {
      toastError({ message: toMessage(error) });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-[#4fae2e]/10 text-[#3f9225] dark:text-[#7ad75d]">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {t("completedTitle")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {t("completedHint")}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <Label htmlFor="review-contract">
            {t("completedContractLabel")}
          </Label>
          {contractsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : contractsError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">
                {t("couldNotLoadContracts")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {contractsError}
              </p>
            </div>
          ) : contracts.length ? (
            <Select
              value={contractId ? String(contractId) : undefined}
              onValueChange={(value) => void loadReviews(Number(value))}
            >
              <SelectTrigger id="review-contract" className="h-10">
                <SelectValue placeholder={t("chooseContractPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={String(contract.id)}>
                    {t("contractOption", {
                      id: contract.id,
                      title: contract.job.title,
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="rounded-lg border border-dashed border-border px-5 py-8 text-center">
              <p className="text-sm font-medium text-foreground">
                {t("noCompletedContracts")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("noCompletedContractsHint")}
              </p>
            </div>
          )}
        </div>

        {selectedContract ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {selectedContract.job.title}
            </span>
            <span>
              {t("reviewing", { name: counterpart ?? memberFallback })}
            </span>
            {selectedContract.completedAt ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden="true" />
                {t("completedAt", {
                  date: formatDate(selectedContract.completedAt),
                })}
              </span>
            ) : null}
          </div>
        ) : null}
      </section>

      {contractId ? (
        pending === "load" ? (
          <ReviewSkeleton label={t("loadingReviewsAria")} />
        ) : reviewsError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
            <p className="font-medium text-destructive">
              {t("couldNotLoadReviews")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{reviewsError}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => void loadReviews(contractId)}
            >
              {tSettings("tryAgain")}
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
            <section
              id="review-editor"
              className="h-fit scroll-mt-24 rounded-xl border border-border p-5 sm:p-6"
            >
              {ownReview && !editingId ? (
                <div>
                  <div className="flex items-center gap-2 text-[#3f9225] dark:text-[#7ad75d]">
                    <CheckCircle2 className="size-5" aria-hidden="true" />
                    <h2 className="font-semibold">{t("ownReviewTitle")}</h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t("ownReviewHint")}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => startEdit(ownReview)}
                  >
                    <Pencil aria-hidden="true" /> {t("editYourReview")}
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-foreground">
                    {editingId
                      ? t("editYourReview")
                      : t("reviewCounterpart", {
                          name: counterpart ?? memberFallback,
                        })}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {t("feedbackHint")}
                  </p>
                  <form className="mt-5 space-y-5" onSubmit={submitReview}>
                    <fieldset className="space-y-2">
                      <legend className="text-sm font-medium">
                        {t("overallRating")}
                      </legend>
                      <div className="flex gap-1" role="radiogroup">
                        {[1, 2, 3, 4, 5].map((value) => {
                          const selected = Number(rating) >= value;
                          return (
                            <button
                              key={value}
                              type="button"
                              role="radio"
                              aria-checked={Number(rating) === value}
                              aria-label={t("starAria", { count: value })}
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-[#4fae2e]/10 hover:text-[#3f9225] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4fae2e]/40 active:scale-95 dark:hover:text-[#7ad75d]"
                              onClick={() => setRating(String(value))}
                            >
                              <Star
                                className={`size-6 ${selected ? "fill-[#4fae2e] text-[#4fae2e]" : ""}`}
                                aria-hidden="true"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>

                    {Object.entries(breakdown).map(([key, value]) => (
                      <div className="space-y-2" key={key}>
                        <Label htmlFor={`rating-${key}`}>
                          {breakdownLabel(key)}
                        </Label>
                        <Input
                          id={`rating-${key}`}
                          type="number"
                          min="1"
                          max="5"
                          step="0.5"
                          required
                          value={value}
                          onChange={(event) =>
                            setBreakdown((current) => ({
                              ...current,
                              [key]: event.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}

                    <div className="space-y-2">
                      <Label htmlFor="review-comment">{t("commentLabel")}</Label>
                      <Textarea
                        id="review-comment"
                        maxLength={3000}
                        rows={5}
                        placeholder={t("commentPlaceholder")}
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("characters", { count: comment.length })}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="bg-[#4fae2e] text-white hover:bg-[#459928] active:translate-y-px"
                        disabled={
                          pending === "create" ||
                          pending === `review-${editingId}`
                        }
                      >
                        {pending === "create" ||
                        pending === `review-${editingId}` ? (
                          <Loader2
                            className="animate-spin"
                            aria-hidden="true"
                          />
                        ) : editingId ? (
                          <Pencil aria-hidden="true" />
                        ) : (
                          <Plus aria-hidden="true" />
                        )}
                        {editingId
                          ? tSettings("saveChanges")
                          : t("submitReview")}
                      </Button>
                      {editingId ? (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={resetReviewForm}
                        >
                          {tCommon("cancel")}
                        </Button>
                      ) : null}
                    </div>
                  </form>
                </>
              )}
            </section>

            <section aria-labelledby="contract-review-list-heading">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2
                  id="contract-review-list-heading"
                  className="text-lg font-semibold text-foreground"
                >
                  {t("contractFeedback")}
                </h2>
                <Badge variant="secondary">
                  {t("reviewCount", { count: reviews.length })}
                </Badge>
              </div>

              {reviews.length ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-xl border border-border p-5 sm:p-6"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-foreground">
                            {t("reviewedBy", {
                              reviewer: reviewUserName(
                                review,
                                "reviewer",
                                memberFallback,
                              ),
                              reviewee: reviewUserName(
                                review,
                                "reviewee",
                                memberFallback,
                              ),
                            })}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(review.createdAt)}
                            {new Date(review.updatedAt).getTime() !==
                            new Date(review.createdAt).getTime()
                              ? t("editedSuffix")
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[#3f9225] dark:text-[#7ad75d]">
                          <Star
                            className="size-4 fill-current"
                            aria-hidden="true"
                          />
                          <span className="font-semibold">
                            {review.overallRating.toFixed(1)}
                          </span>
                          <span className="sr-only">{t("outOf5")}</span>
                        </div>
                      </div>

                      {review.comment ? (
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground/80">
                          {review.comment}
                        </p>
                      ) : (
                        <p className="mt-4 text-sm italic text-muted-foreground">
                          {t("noWrittenComment")}
                        </p>
                      )}

                      {expandedId === review.id ? (
                        <div className="mt-4 rounded-lg bg-muted/55 p-4 text-sm">
                          <dl className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <dt className="text-xs text-muted-foreground">
                                {t("createdLabel")}
                              </dt>
                              <dd className="mt-1 font-medium">
                                {formatDate(review.createdAt)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-muted-foreground">
                                {t("lastUpdated")}
                              </dt>
                              <dd className="mt-1 font-medium">
                                {formatDate(review.updatedAt)}
                              </dd>
                            </div>
                          </dl>
                          <div className="mt-4 grid gap-2 sm:grid-cols-3">
                            {Object.entries(review.breakdown ?? {}).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="rounded-lg border border-border bg-background px-3 py-2"
                                >
                                  <p className="text-xs text-muted-foreground">
                                    {breakdownLabel(key)}
                                  </p>
                                  <p className="mt-1 font-semibold text-foreground">
                                    {value}/5
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      ) : null}

                      {review.response ? (
                        <div className="mt-5 border-l-2 border-[#4fae2e] pl-4">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("responseFrom", {
                              name: responseUserName(review, memberFallback),
                            })}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/80">
                            {review.response.responseText}
                          </p>
                          {new Date(review.response.updatedAt).getTime() >
                          new Date(review.response.createdAt).getTime() ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t("editedAt", {
                                date: formatDate(review.response.updatedAt),
                              })}
                            </p>
                          ) : null}
                          {review.response.userId === userId ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setResponseReviewId(review.id);
                                  setEditingResponseId(
                                    review.response?.id ?? null,
                                  );
                                  setResponseText(
                                    review.response?.responseText ?? "",
                                  );
                                }}
                              >
                                <Pencil aria-hidden="true" />{" "}
                                {t("editResponse")}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() =>
                                  setDeleteResponseReviewId(review.id)
                                }
                                disabled={
                                  pending === `response-delete-${review.id}`
                                }
                              >
                                <Trash2 aria-hidden="true" />{" "}
                                {t("deleteResponse")}
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {responseReviewId === review.id ? (
                        <form
                          className="mt-4 space-y-3"
                          onSubmit={(event) =>
                            void submitResponse(event, review)
                          }
                        >
                          <Label htmlFor={`response-${review.id}`}>
                            {editingResponseId
                              ? t("editResponse")
                              : t("respondToReview")}
                          </Label>
                          <Textarea
                            id={`response-${review.id}`}
                            required
                            maxLength={3000}
                            rows={3}
                            value={responseText}
                            onChange={(event) =>
                              setResponseText(event.target.value)
                            }
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                              disabled={pending === `response-${review.id}`}
                            >
                              {t("saveResponse")}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setResponseReviewId(null);
                                setEditingResponseId(null);
                                setResponseText("");
                              }}
                            >
                              {tCommon("cancel")}
                            </Button>
                          </div>
                        </form>
                      ) : null}

                      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void viewDetail(review.id)}
                          disabled={pending === `detail-${review.id}`}
                        >
                          {pending === `detail-${review.id}` ? (
                            <Loader2
                              className="animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <Eye aria-hidden="true" />
                          )}
                          {expandedId === review.id
                            ? t("hideDetail")
                            : t("viewDetail")}
                        </Button>
                        {review.reviewerId === userId ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(review)}
                            >
                              <Pencil aria-hidden="true" /> {t("edit")}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteReviewId(review.id)}
                            >
                              <Trash2 aria-hidden="true" /> {t("delete")}
                            </Button>
                          </>
                        ) : null}
                        {review.revieweeId === userId && !review.response ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setResponseReviewId(review.id);
                              setEditingResponseId(null);
                              setResponseText("");
                            }}
                          >
                            <MessageSquareReply aria-hidden="true" />{" "}
                            {t("respond")}
                          </Button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
                  <Star
                    className="mx-auto size-8 text-[#4fae2e]"
                    aria-hidden="true"
                  />
                  <p className="mt-3 font-medium text-foreground">
                    {t("noReviewsYet")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("noReviewsHint", {
                      name: counterpart ?? memberFallback,
                    })}
                  </p>
                </div>
              )}
            </section>
          </div>
        )
      ) : !contractsLoading && !contractsError && contracts.length ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <MessageSquareReply
            className="mx-auto size-9 text-[#4fae2e]"
            aria-hidden="true"
          />
          <p className="mt-3 font-medium text-foreground">
            {t("choosePrompt")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("choosePromptHint")}
          </p>
        </div>
      ) : null}

      <AlertDialog
        open={deleteReviewId !== null}
        onOpenChange={(open) => {
          if (!open && !pending?.startsWith("delete-")) setDeleteReviewId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteReviewTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteReviewHint")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending?.startsWith("delete-")}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={pending?.startsWith("delete-")}
              onClick={(event) => {
                event.preventDefault();
                void removeReview();
              }}
            >
              {pending?.startsWith("delete-") ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 aria-hidden="true" />
              )}
              {t("deleteReviewAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteResponseReviewId !== null}
        onOpenChange={(open) => {
          if (!open && !pending?.startsWith("response-delete-")) {
            setDeleteResponseReviewId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteResponseTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteResponseHint")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={pending?.startsWith("response-delete-")}
            >
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={pending?.startsWith("response-delete-")}
              onClick={(event) => {
                event.preventDefault();
                const review = reviews.find(
                  (item) => item.id === deleteResponseReviewId,
                );
                if (review) void removeResponse(review);
              }}
            >
              {pending?.startsWith("response-delete-") ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 aria-hidden="true" />
              )}
              {t("deleteResponseAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

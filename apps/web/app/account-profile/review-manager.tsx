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
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

const initialBreakdown = { quality: "5", communication: "5", deadlines: "5" };
const breakdownLabels: Record<keyof typeof initialBreakdown, string> = {
  quality: "Work quality",
  communication: "Communication",
  deadlines: "Deadline reliability",
};

function errorMessage(error: unknown) {
  if (error instanceof ApiFail) {
    return error.response.error.details?.[0]?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

function reviewUserName(review: ReviewType, key: "reviewer" | "reviewee") {
  return review[key].profile?.displayName?.trim() || "Frevia member";
}

function responseUserName(review: ReviewType) {
  return review.response?.user.profile?.displayName?.trim() || "Frevia member";
}

function contractUserName(
  contract: ContractDetailType,
  key: "client" | "freelancer",
) {
  return contract[key].profile?.displayName?.trim() || "Frevia member";
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ReviewSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading reviews">
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
      ? contractUserName(selectedContract, "freelancer")
      : contractUserName(selectedContract, "client")
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
            if (!cancelled) setReviewsError(errorMessage(error));
          }
        }
      } catch (error) {
        if (!cancelled) setContractsError(errorMessage(error));
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
  }, [requestedContractId]);

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
      const message = errorMessage(error);
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
        toastSuccess({ message: "Review updated." });
      } else {
        const response = await reviewApi.create(contractId, body);
        setReviews((current) => [response.data, ...current]);
        toastSuccess({
          message: "Review submitted. The recipient was notified.",
        });
      }
      resetReviewForm();
    } catch (error) {
      toastError({ message: errorMessage(error) });
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
      toastSuccess({ message: "Review deleted." });
      setDeleteReviewId(null);
    } catch (error) {
      toastError({ message: errorMessage(error) });
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
      toastError({ message: errorMessage(error) });
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
        message: responseId ? "Response updated." : "Response posted.",
      });
    } catch (error) {
      toastError({ message: errorMessage(error) });
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
      toastSuccess({ message: "Response deleted." });
    } catch (error) {
      toastError({ message: errorMessage(error) });
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
              Completed contract reviews
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Select a completed contract to review the other participant or
              manage feedback already submitted.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <Label htmlFor="review-contract">Completed contract</Label>
          {contractsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : contractsError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">
                Could not load completed contracts
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
                <SelectValue placeholder="Choose a completed contract" />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={String(contract.id)}>
                    #{contract.id} - {contract.job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="rounded-lg border border-dashed border-border px-5 py-8 text-center">
              <p className="text-sm font-medium text-foreground">
                No completed contracts yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Reviews become available after a contract is completed.
              </p>
            </div>
          )}
        </div>

        {selectedContract ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {selectedContract.job.title}
            </span>
            <span>Reviewing: {counterpart}</span>
            {selectedContract.completedAt ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden="true" />
                Completed {formatDate(selectedContract.completedAt)}
              </span>
            ) : null}
          </div>
        ) : null}
      </section>

      {contractId ? (
        pending === "load" ? (
          <ReviewSkeleton />
        ) : reviewsError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
            <p className="font-medium text-destructive">
              Could not load reviews
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{reviewsError}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => void loadReviews(contractId)}
            >
              Try again
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
                    <h2 className="font-semibold">Your review was submitted</h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Each participant can submit one review per contract. You can
                    still edit or delete your review from the list.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => startEdit(ownReview)}
                  >
                    <Pencil aria-hidden="true" /> Edit your review
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-foreground">
                    {editingId ? "Edit your review" : `Review ${counterpart}`}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Share specific, respectful feedback based on this contract.
                  </p>
                  <form className="mt-5 space-y-5" onSubmit={submitReview}>
                    <fieldset className="space-y-2">
                      <legend className="text-sm font-medium">
                        Overall rating
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
                              aria-label={`${value} star${value === 1 ? "" : "s"}`}
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
                          {
                            breakdownLabels[
                              key as keyof typeof initialBreakdown
                            ]
                          }
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
                      <Label htmlFor="review-comment">Comment</Label>
                      <Textarea
                        id="review-comment"
                        maxLength={3000}
                        rows={5}
                        placeholder="Describe what went well and what could improve."
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {comment.length}/3000 characters
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
                        {editingId ? "Save changes" : "Submit review"}
                      </Button>
                      {editingId ? (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={resetReviewForm}
                        >
                          Cancel
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
                  Contract feedback
                </h2>
                <Badge variant="secondary">
                  {reviews.length} review{reviews.length === 1 ? "" : "s"}
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
                            {reviewUserName(review, "reviewer")} reviewed{" "}
                            {reviewUserName(review, "reviewee")}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(review.createdAt)}
                            {new Date(review.updatedAt).getTime() !==
                            new Date(review.createdAt).getTime()
                              ? " - Edited"
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
                          <span className="sr-only">out of 5</span>
                        </div>
                      </div>

                      {review.comment ? (
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground/80">
                          {review.comment}
                        </p>
                      ) : (
                        <p className="mt-4 text-sm italic text-muted-foreground">
                          No written comment.
                        </p>
                      )}

                      {expandedId === review.id ? (
                        <div className="mt-4 rounded-lg bg-muted/55 p-4 text-sm">
                          <dl className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <dt className="text-xs text-muted-foreground">
                                Created
                              </dt>
                              <dd className="mt-1 font-medium">
                                {formatDate(review.createdAt)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-muted-foreground">
                                Last updated
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
                                    {breakdownLabels[
                                      key as keyof typeof initialBreakdown
                                    ] ?? key}
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
                            Response from {responseUserName(review)}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/80">
                            {review.response.responseText}
                          </p>
                          {new Date(review.response.updatedAt).getTime() >
                          new Date(review.response.createdAt).getTime() ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Edited {formatDate(review.response.updatedAt)}
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
                                <Pencil aria-hidden="true" /> Edit response
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
                                <Trash2 aria-hidden="true" /> Delete response
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
                              ? "Edit response"
                              : "Respond to review"}
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
                              Save response
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
                              Cancel
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
                            ? "Hide detail"
                            : "View detail"}
                        </Button>
                        {review.reviewerId === userId ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(review)}
                            >
                              <Pencil aria-hidden="true" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteReviewId(review.id)}
                            >
                              <Trash2 aria-hidden="true" /> Delete
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
                            <MessageSquareReply aria-hidden="true" /> Respond
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
                    No reviews for this contract yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Submit constructive feedback for {counterpart}.
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
            Choose a completed contract
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Both participants can submit one review and respond to feedback.
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
            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>
              The review will no longer be visible. It may still be retained for
              moderation and audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending?.startsWith("delete-")}>
              Cancel
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
              Delete review
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
            <AlertDialogTitle>Delete this response?</AlertDialogTitle>
            <AlertDialogDescription>
              Your response will no longer be visible. You can post a new
              response to this review later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={pending?.startsWith("response-delete-")}
            >
              Cancel
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
              Delete response
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

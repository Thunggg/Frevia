"use client";

import { reviewApi } from "@/apiRequests/review";
import { ApiFail } from "@/lib/http";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { ReviewType } from "@shared/types";
import {
  Eye,
  Loader2,
  MessageSquareReply,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

function errorMessage(error: unknown) {
  if (error instanceof ApiFail) {
    return error.response.error.details?.[0]?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

function userName(review: ReviewType, key: "reviewer" | "reviewee") {
  return review[key].profile?.displayName ?? review[key].email;
}

const initialBreakdown = { quality: "5", communication: "5", deadlines: "5" };

export function ReviewManager({ userId }: { userId: number }) {
  const searchParams = useSearchParams();
  const [contractInput, setContractInput] = useState(
    searchParams.get("contractId") ?? "",
  );
  const [contractId, setContractId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
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
  const [pending, setPending] = useState<string | null>(null);

  const replaceReview = (review: ReviewType) =>
    setReviews((current) =>
      current.map((item) => (item.id === review.id ? review : item)),
    );

  const loadReviews = async (event?: FormEvent) => {
    event?.preventDefault();
    const nextContractId = Number(contractInput);
    if (!Number.isInteger(nextContractId) || nextContractId <= 0) {
      toastError({ message: "Enter a valid contract ID." });
      return;
    }
    setPending("load");
    try {
      const response = await reviewApi.list(nextContractId);
      setContractId(nextContractId);
      setReviews(response.data);
      setEditingId(null);
      setExpandedId(null);
    } catch (error) {
      toastError({ message: errorMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!contractId) {
      toastError({ message: "Load a contract before writing a review." });
      return;
    }
    const body = {
      overallRating: Number(rating),
      breakdown: {
        quality: Number(breakdown.quality),
        communication: Number(breakdown.communication),
        deadlines: Number(breakdown.deadlines),
      },
      comment: comment || null,
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
        toastSuccess({ message: "Review submitted." });
      }
      setEditingId(null);
      setRating("5");
      setComment("");
      setBreakdown(initialBreakdown);
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
  };

  const removeReview = async (reviewId: number) => {
    setPending(`delete-${reviewId}`);
    try {
      await reviewApi.remove(reviewId);
      setReviews((current) => current.filter((item) => item.id !== reviewId));
      toastSuccess({ message: "Review deleted." });
    } catch (error) {
      toastError({ message: errorMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const viewDetail = async (reviewId: number) => {
    setPending(`detail-${reviewId}`);
    try {
      const response = await reviewApi.detail(reviewId);
      replaceReview(response.data);
      setExpandedId((current) => (current === reviewId ? null : reviewId));
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
        <h2 className="text-lg font-semibold text-foreground">
          Contract reviews
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter a contract ID that belongs to your account to view or manage its
          reviews.
        </p>
        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row"
          onSubmit={loadReviews}
        >
          <div className="flex-1">
            <Label htmlFor="contract-id" className="sr-only">
              Contract ID
            </Label>
            <Input
              id="contract-id"
              inputMode="numeric"
              min="1"
              placeholder="Contract ID, for example 1"
              value={contractInput}
              onChange={(event) => setContractInput(event.target.value)}
            />
          </div>
          <Button
            className="bg-[#4fae2e] text-white hover:bg-[#459928]"
            disabled={pending === "load"}
          >
            {pending === "load" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Eye />
            )}
            Load reviews
          </Button>
        </form>
      </section>

      {contractId ? (
        <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
          <section className="h-fit rounded-xl border border-border p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-foreground">
              {editingId ? `Edit review #${editingId}` : "Write a review"}
            </h2>
            <form className="mt-5 space-y-5" onSubmit={submitReview}>
              <div className="space-y-2">
                <Label htmlFor="overall-rating">Overall rating</Label>
                <Input
                  id="overall-rating"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  required
                  value={rating}
                  onChange={(event) => setRating(event.target.value)}
                />
              </div>
              {Object.entries(breakdown).map(([key, value]) => (
                <div className="space-y-2" key={key}>
                  <Label htmlFor={`rating-${key}`} className="capitalize">
                    {key}
                  </Label>
                  <Input
                    id={`rating-${key}`}
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
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
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                  disabled={
                    pending === "create" || pending === `review-${editingId}`
                  }
                >
                  {pending === "create" || pending === `review-${editingId}` ? (
                    <Loader2 className="animate-spin" />
                  ) : editingId ? (
                    <Pencil />
                  ) : (
                    <Plus />
                  )}
                  {editingId ? "Save review" : "Submit review"}
                </Button>
                {editingId ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                Reviews for contract #{contractId}
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
                          {userName(review, "reviewer")} reviewed{" "}
                          {userName(review, "reviewee")}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Review #{review.id}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-[#3f9225]">
                        <Star className="size-4 fill-current" />
                        <span className="font-semibold">
                          {review.overallRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    {review.comment ? (
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground/80">
                        {review.comment}
                      </p>
                    ) : null}
                    {expandedId === review.id ? (
                      <div className="mt-4 rounded-lg bg-muted/55 p-4 text-sm">
                        <p>
                          <span className="font-medium">Created:</span>{" "}
                          {new Date(review.createdAt).toLocaleString()}
                        </p>
                        <p className="mt-1">
                          <span className="font-medium">Updated:</span>{" "}
                          {new Date(review.updatedAt).toLocaleString()}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {Object.entries(review.breakdown ?? {}).map(
                            ([key, value]) => (
                              <Badge
                                key={key}
                                variant="outline"
                                className="capitalize"
                              >
                                {key}: {value}
                              </Badge>
                            ),
                          )}
                        </div>
                        <pre className="mt-3 overflow-x-auto text-xs text-muted-foreground">
                          {JSON.stringify(review.breakdown, null, 2)}
                        </pre>
                      </div>
                    ) : null}

                    {review.response ? (
                      <div className="mt-5 border-l-2 border-[#4fae2e] pl-4">
                        <p className="text-xs font-medium text-muted-foreground">
                          Response from{" "}
                          {review.response.user.profile?.displayName ??
                            review.response.user.email}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/80">
                          {review.response.responseText}
                        </p>
                        {review.response.userId === userId ? (
                          <div className="mt-2 flex gap-2">
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
                              <Pencil /> Edit response
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void removeResponse(review)}
                              disabled={
                                pending === `response-delete-${review.id}`
                              }
                            >
                              <Trash2 /> Delete response
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {responseReviewId === review.id ? (
                      <form
                        className="mt-4 space-y-3"
                        onSubmit={(event) => void submitResponse(event, review)}
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
                        <Eye />{" "}
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
                            <Pencil /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => void removeReview(review.id)}
                            disabled={pending === `delete-${review.id}`}
                          >
                            <Trash2 /> Delete
                          </Button>
                        </>
                      ) : null}
                      {review.revieweeId === userId && !review.response ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setResponseReviewId(review.id);
                            setResponseText("");
                          }}
                        >
                          <MessageSquareReply /> Respond
                        </Button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
                <Star className="mx-auto size-8 text-[#4fae2e]" />
                <p className="mt-3 font-medium text-foreground">
                  No reviews for this contract yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use the form to submit the first review.
                </p>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <MessageSquareReply className="mx-auto size-9 text-[#4fae2e]" />
          <p className="mt-3 font-medium text-foreground">
            Load a contract to start
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Only contract participants can access its reviews.
          </p>
        </div>
      )}
    </div>
  );
}

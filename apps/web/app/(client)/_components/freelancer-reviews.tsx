"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { reviewApi } from "@/apiRequests/review";
import { Loader2, Star } from "@/components/icons";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";

export function FreelancerReviews({ userId }: { userId: number }) {
  const t = useTranslations("freelancerSheet.reviews");
  const format = useFormatter();
  const query = useInfiniteQuery({
    queryKey: ["freelancer-reviews", userId],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      (await reviewApi.freelancerReviews(userId, pageParam)).data,
    getNextPageParam: (last) =>
      last.page * last.limit < last.total ? last.page + 1 : undefined,
    staleTime: 30_000,
  });
  const summary = query.data?.pages[0];
  const reviews = Array.from(
    new Map(
      query.data?.pages
        .flatMap((page) => page.reviews)
        .map((review) => [review.id, review]),
    ).values(),
  );

  return (
    <section
      className="space-y-5"
      aria-label={t("title")}
      aria-busy={query.isFetching}
    >
      {query.isPending ? (
        <div
          role="status"
          className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"
        >
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          {t("loading")}
        </div>
      ) : null}
      {summary && summary.total > 0 && summary.avgRating !== null ? (
        <div className="flex items-center gap-3 border-b border-border pb-5">
          <Star
            className="size-6 fill-amber-400 text-amber-400"
            aria-hidden="true"
          />
          <span className="text-3xl font-semibold tabular-nums">
            {format.number(summary.avgRating, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
            <span className="text-sm text-muted-foreground"> / 5</span>
          </span>
          <span className="text-sm text-muted-foreground">
            {t("count", { count: summary.total })}
          </span>
        </div>
      ) : null}
      {summary?.total === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : null}
      {reviews.map((review) => {
        const name = review.reviewer?.displayName || t("client");
        return (
          <article
            key={review.id}
            className="rounded-xl border border-border p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <Avatar className="size-9">
                <AvatarImage
                  src={review.reviewer?.avatarUrl || undefined}
                  alt={name}
                />
                <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold">{name}</p>
                <time
                  dateTime={new Date(review.createdAt).toISOString()}
                  className="text-xs text-muted-foreground"
                >
                  {format.dateTime(new Date(review.createdAt), {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </div>
              <span
                className="flex shrink-0 items-center gap-1 text-sm"
                aria-label={t("rating", { rating: review.overallRating })}
              >
                <Star
                  className="size-4 fill-amber-400 text-amber-400"
                  aria-hidden="true"
                />
                {format.number(review.overallRating)} / 5
              </span>
            </div>
            {review.comment ? (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {review.comment}
              </p>
            ) : null}
            {review.response ? (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="mb-1 text-xs font-semibold">{t("response")}</p>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {review.response.responseText}
                </p>
              </div>
            ) : null}
          </article>
        );
      })}
      {query.isError ? (
        <div role="alert" className="space-y-3 text-center">
          <p className="text-sm text-destructive">{t("loadFailed")}</p>
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() =>
              void (query.isFetchNextPageError
                ? query.fetchNextPage()
                : query.refetch())
            }
          >
            {t("retry")}
          </Button>
        </div>
      ) : null}
      {query.hasNextPage && !query.isFetchNextPageError ? (
        <Button
          variant="outline"
          className="w-full"
          disabled={query.isFetching}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? t("loading") : t("more")}
        </Button>
      ) : null}
    </section>
  );
}
